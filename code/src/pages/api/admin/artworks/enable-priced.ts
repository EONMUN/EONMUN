import type { APIRoute } from "astro";
import { enablePricedArtworks } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const enabled = await enablePricedArtworks(env);
		return Response.json({ enabled: enabled.length });
	} catch (error) {
		return mutationError(error);
	}
};
