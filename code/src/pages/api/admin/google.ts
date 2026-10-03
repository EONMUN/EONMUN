import type { APIRoute } from "astro";
import { getArtworkCatalogIds, getAvailableArtworkCatalog } from "../../../db/catalog";
import { requireAdminMutation } from "../../../lib/admin-guard";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { GoogleMerchantError, syncGoogleCatalog } from "../../../lib/google-merchant";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const [artworks, ids] = await Promise.all([getAvailableArtworkCatalog(env), getArtworkCatalogIds(env)]);
		return Response.json(await syncGoogleCatalog(env, artworks, ids), { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		return Response.json({ error: error instanceof GoogleMerchantError ? error.message : "Google Merchant sync failed" },
			{ status: 502, headers: { "Cache-Control": "no-store" } });
	}
};
