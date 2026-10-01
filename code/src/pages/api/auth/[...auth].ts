import type { APIRoute } from "astro";

import { createAuth, getAuthConfigIssues, getSession } from "../../../lib/auth";
import { getRuntimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

const handler: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const issues = getAuthConfigIssues(env);

	if (issues.length > 0) {
		return new Response(
			`Better Auth is not configured. Missing: ${issues.join(", ")}.`,
			{
				status: 503,
				headers: {
					"content-type": "text/plain; charset=utf-8",
					"cache-control": "no-store",
				},
			},
		);
	}

	if (new URL(request.url).pathname === "/api/auth/session" && request.method === "GET") {
		return Response.json(await getSession(request, env), { headers: { "cache-control": "no-store" } });
	}
	return createAuth(env, request).handler(request);
};

export const GET = handler;
export const POST = handler;
