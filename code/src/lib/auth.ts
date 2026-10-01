import { betterAuth } from "better-auth/minimal";
import { APIError } from "better-auth/api";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";

export interface AuthEnv {
	ADMIN_EMAILS?: string;
	AUTH_GOOGLE_ID?: string;
	AUTH_GOOGLE_SECRET?: string;
	AUTH_SECRET?: string;
	AUTH_PROXY_URL?: string;
	OAUTH_PROXY_SECRET?: string;
	GOOGLE_CLIENT_ID?: string;
	GOOGLE_CLIENT_SECRET?: string;
	[key: string]: unknown;
}

export interface AdminSession {
	user: {
		id?: string;
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

const trustedOrigins = [
	"https://eonmun.com",
	"https://eonmun-astro.ncrmro.workers.dev",
	"https://*-eonmun-astro.ncrmro.workers.dev",
	"http://localhost:*",
	"http://127.0.0.1:*",
];

export function createAuth(env: AuthEnv, request: Request) {
	// This instance handles one request; never share provider identity between requests.
	let googleId: string | undefined;
	return betterAuth({
		baseURL: new URL(request.url).origin,
		basePath: "/api/auth",
		secret: requireStringEnv(env, "AUTH_SECRET"),
		trustedOrigins,
		// Stateless encrypted sessions preserve the existing admin-only deployment without auth tables.
		session: { expiresIn: 30 * 24 * 60 * 60, cookieCache: {
			enabled: true, strategy: "jwe", maxAge: 30 * 24 * 60 * 60, refreshCache: false,
		} },
		account: { storeStateStrategy: "cookie", storeAccountCookie: false },
		user: {
			additionalFields: { googleId: { type: "string", required: false, input: false } },
			validateUserInfo({ user, source }) {
				const subject = source.oauth?.profile?.sub;
				if (source.oauth?.providerId !== "google" || typeof subject !== "string" || !subject
					|| user.emailVerified !== true || !isAllowedAdminEmail(user.email, env)) {
					return { error: "admin_access_denied" };
				}
				googleId = subject;
			},
		},
		socialProviders: { google: {
			clientId: getStringEnv(env, "GOOGLE_CLIENT_ID") ?? getStringEnv(env, "AUTH_GOOGLE_ID") ?? "",
			clientSecret: getStringEnv(env, "GOOGLE_CLIENT_SECRET") ?? getStringEnv(env, "AUTH_GOOGLE_SECRET") ?? "",
		} },
		databaseHooks: { user: { create: { before(user) {
			if (!googleId || !user.emailVerified || !isAllowedAdminEmail(user.email, env)) {
				throw new APIError("FORBIDDEN", { message: "This account does not have admin access." });
			}
			return { data: { ...user, googleId } };
		} } } },
		plugins: [{
			id: "same-origin-oauth-return",
			async onRequest(request) {
				if (request.method !== "POST" || !new URL(request.url).pathname.endsWith("/sign-in/social")) return;
				try {
					const body = await request.clone().json();
					// SECURITY: validate return URLs before the proxy replaces them with its callback URL.
					for (const key of ["callbackURL", "newUserCallbackURL", "errorCallbackURL"]) {
						if (body[key] && new URL(body[key], request.url).origin !== new URL(request.url).origin) {
							return { response: Response.json({ error: "Invalid callback origin" }, { status: 403 }) };
						}
					}
				} catch {
					return { response: Response.json({ error: "Invalid sign-in request" }, { status: 400 }) };
				}
			},
		}, oAuthProxy({
			productionURL: getStringEnv(env, "AUTH_PROXY_URL") ?? "https://eonmun.com",
			// Worker versions inherit the same secret; optionally separate proxy encryption from sessions.
			secret: getStringEnv(env, "OAUTH_PROXY_SECRET") ?? requireStringEnv(env, "AUTH_SECRET"),
		})],
	});
}

export function getSignInUrl(request: Request, callbackPath = "/admin") {
	const signInUrl = new URL("/api/auth/signin", request.url);
	signInUrl.searchParams.set("callbackUrl", callbackPath);
	return signInUrl;
}

export async function getSession(request: Request, env: AuthEnv): Promise<AdminSession | null> {
	try {
		const payload = await createAuth(env, request).api.getSession({ headers: request.headers });
		if (!payload?.user?.emailVerified || !isAllowedAdminEmail(payload.user.email, env)
			|| !payload.user.googleId) return null;
		return { user: { ...payload.user, id: payload.user.googleId }, expires: payload.session.expiresAt.toISOString() };
	} catch {
		return null;
	}
}
