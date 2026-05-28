import type { APIRoute } from "astro";
import { Auth } from "@auth/core";

import { getAuthConfig, getAuthConfigIssues } from "../../../lib/auth";
import { getRuntimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

const handler: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const issues = getAuthConfigIssues(env);

	if (issues.length > 0) {
		return new Response(
			`Auth.js is not configured. Missing: ${issues.join(", ")}.`,
			{
				status: 503,
				headers: {
					"content-type": "text/plain; charset=utf-8",
					"cache-control": "no-store",
				},
			},
		);
	}

	return Auth(request, getAuthConfig(env));
};

export const GET = handler;
export const POST = handler;
