import { getSession, getSignInUrl, type AdminSession, type AuthEnv } from "./auth";
import { redirectResponse } from "./redirect";

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
		: { response: redirectResponse(getSignInUrl(request, callbackPath), 302) };
}

// Drizzle wraps a driver failure as "Failed query: <sql> params: <values>" and
// keeps the driver's own error as the cause, so the constraint text a slug
// collision is recognised by is never in the outermost message.
function errorMessages(error: unknown) {
	const messages: string[] = [];
	let current: unknown = error;
	while (current instanceof Error && messages.length < 5) {
		messages.push(current.message);
		current = (current as { cause?: unknown }).cause;
	}
	return messages;
}

export function mutationError(error: unknown) {
	const messages = errorMessages(error);
	const conflict = messages.some((message) =>
		/unique constraint failed:[^\n]*\bslug\b/i.test(message) ||
		/SQLITE_CONSTRAINT_UNIQUE[^\n]*\bslug\b/i.test(message));
	// SECURITY: the wrapper message repeats the statement and every bound
	// parameter back to the caller. Report the driver's message instead.
	const reported = messages.find((message) => !message.startsWith("Failed query:")) ?? "Mutation failed";
	return Response.json(
		{ error: conflict ? "Slug already exists" : reported },
		{ status: conflict ? 409 : 400 },
	);
}
