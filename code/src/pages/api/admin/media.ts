import type { APIRoute } from "astro";

import { requireAdminMutation } from "../../../lib/admin-guard";
import { handleArtworkMediaUpload } from "../../../lib/media";
import { getRuntimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	return handleArtworkMediaUpload(request, env);
};
