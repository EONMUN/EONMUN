import { getSession, getSignInUrl, type AdminSession, type AuthEnv } from "./auth";
import { driverErrorMessage, errorMessages } from "./driver-error";
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

export function mutationError(error: unknown) {
	const messages = errorMessages(error);
	const conflict = messages.some((message) =>
		/unique constraint failed:[^\n]*\bslug\b/i.test(message) ||
		/SQLITE_CONSTRAINT_UNIQUE[^\n]*\bslug\b/i.test(message));
	const reported = driverErrorMessage(error, "Mutation failed");
	return Response.json(
		{ error: conflict ? "Slug already exists" : reported },
		{ status: conflict ? 409 : 400 },
	);
}
