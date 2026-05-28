import { Auth, type AuthConfig } from "@auth/core";
import Google, { type GoogleProfile } from "@auth/core/providers/google";

export interface AuthEnv {
	ADMIN_EMAILS?: string;
	AUTH_GOOGLE_ID?: string;
	AUTH_GOOGLE_SECRET?: string;
	AUTH_SECRET?: string;
	AUTH_REDIRECT_PROXY_URL?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	[key: string]: unknown;
}

export interface AdminSession {
	user: {
		email: string;
		name?: string | null;
		image?: string | null;
	};
	expires?: string;
}

function requireStringEnv(env: AuthEnv, key: keyof AuthEnv) {
	const value = env[key];
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`${String(key)} is not configured`);
	}

	return value;
}

function getStringEnv(env: AuthEnv, key: keyof AuthEnv) {
	const value = env[key];
	return typeof value === "string" && value.trim() ? value : null;
}

export function getAllowedAdminEmails(env: AuthEnv) {
	const rawEmails = typeof env.ADMIN_EMAILS === "string" ? env.ADMIN_EMAILS : "";
	return new Set(
		rawEmails
			.split(",")
			.map((email) => email.trim().toLowerCase())
			.filter(Boolean),
	);
}

export function isAllowedAdminEmail(email: string | null | undefined, env: AuthEnv) {
	if (!email) return false;
	return getAllowedAdminEmails(env).has(email.toLowerCase());
}

export function getAuthConfigIssues(env: AuthEnv) {
	const issues: string[] = [];
	const googleClientId = getStringEnv(env, "GOOGLE_CLIENT_ID") ?? getStringEnv(env, "AUTH_GOOGLE_ID");
	const googleClientSecret =
		getStringEnv(env, "GOOGLE_CLIENT_SECRET") ?? getStringEnv(env, "AUTH_GOOGLE_SECRET");

	if (!getStringEnv(env, "AUTH_SECRET")) issues.push("AUTH_SECRET");
	if (!googleClientId) issues.push("GOOGLE_CLIENT_ID or AUTH_GOOGLE_ID");
	if (!googleClientSecret) issues.push("GOOGLE_CLIENT_SECRET or AUTH_GOOGLE_SECRET");
	if (getAllowedAdminEmails(env).size === 0) issues.push("ADMIN_EMAILS");

	return issues;
}

export function getAuthConfig(env: AuthEnv): AuthConfig {
	const allowedAdminEmails = getAllowedAdminEmails(env);
	const googleClientId = getStringEnv(env, "GOOGLE_CLIENT_ID") ?? getStringEnv(env, "AUTH_GOOGLE_ID");
	const googleClientSecret =
		getStringEnv(env, "GOOGLE_CLIENT_SECRET") ?? getStringEnv(env, "AUTH_GOOGLE_SECRET");

	return {
		basePath: "/api/auth",
		secret: requireStringEnv(env, "AUTH_SECRET"),
		trustHost: true,
		redirectProxyUrl:
			typeof env.AUTH_REDIRECT_PROXY_URL === "string" && env.AUTH_REDIRECT_PROXY_URL.trim()
				? env.AUTH_REDIRECT_PROXY_URL
				: undefined,
		providers:
			googleClientId && googleClientSecret
				? [
					Google<GoogleProfile>({
						clientId: googleClientId,
						clientSecret: googleClientSecret,
					}),
				]
				: [],
		session: {
			strategy: "jwt",
			maxAge: 30 * 24 * 60 * 60,
		},
		callbacks: {
			signIn({ profile }) {
				const email = profile?.email?.toLowerCase();
				const emailVerified = profile?.email_verified === true;
				return Boolean(email && emailVerified && allowedAdminEmails.has(email));
			},
			session({ session }) {
				if (session.user?.email && !allowedAdminEmails.has(session.user.email.toLowerCase())) {
					return null;
				}

				return session;
			},
		},
	};
}

export function getSignInUrl(request: Request, callbackPath = "/admin") {
	const signInUrl = new URL("/api/auth/signin", request.url);
	signInUrl.searchParams.set("callbackUrl", callbackPath);
	return signInUrl;
}

export async function getSession(request: Request, env: AuthEnv) {
	const sessionUrl = new URL("/api/auth/session", request.url);
	let response: Response;
	try {
		response = await Auth(
			new Request(sessionUrl, {
				headers: request.headers,
				method: "GET",
			}),
			getAuthConfig(env),
		);
	} catch (error) {
		console.error("Failed to read Auth.js session:", error);
		return null;
	}

	if (!response.ok) {
		return null;
	}

	const payload = await response.json();
	if (!payload?.user?.email || !isAllowedAdminEmail(payload.user.email, env)) {
		return null;
	}

	return payload as AdminSession;
}
