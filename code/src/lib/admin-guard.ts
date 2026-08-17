import { getSession, getSignInUrl, type AdminSession, type AuthEnv } from "./auth";

export function isSameOriginRequest(request: Request) {
	const origin = request.headers.get("origin");
	if (!origin) return false;
	try {
		return new URL(origin).origin === new URL(request.url).origin;
	} catch {
		return false;
	}
}

export async function requireAdminMutation(
	request: Request,
	env: AuthEnv,
): Promise<{ session: AdminSession } | { response: Response }> {
	if (!isSameOriginRequest(request)) {
		return { response: Response.json({ error: "Invalid request origin" }, { status: 403 }) };
	}
	const session = await getSession(request, env);
	if (!session) {
		return { response: Response.json({ error: "Unauthorized" }, { status: 401 }) };
	}
	return { session };
}

export async function requireAdminPage(request: Request, env: AuthEnv, callbackPath: string) {
	const session = await getSession(request, env);
	return session
		? { session }
		: { response: Response.redirect(getSignInUrl(request, callbackPath), 302) };
}

export function mutationError(error: unknown) {
	const message = error instanceof Error ? error.message : "Mutation failed";
	const conflict = /unique constraint failed:[^\n]*\bslug\b/i.test(message) ||
		/SQLITE_CONSTRAINT_UNIQUE[^\n]*\bslug\b/i.test(message);
	return Response.json(
		{ error: conflict ? "Slug already exists" : message },
		{ status: conflict ? 409 : 400 },
	);
}
