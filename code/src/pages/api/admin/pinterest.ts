import type { APIRoute } from "astro";
import { getArtworkCatalogIds, getAvailableArtworkCatalog } from "../../../db/catalog";
import { requireAdminMutation } from "../../../lib/admin-guard";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { getPinterestBatchStatus, isPinterestConfigured, PinterestSyncError, syncPinterestCatalog } from "../../../lib/pinterest-sync";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const body = await request.json() as { batchId?: unknown; deletionIds?: unknown };
		if (!isPinterestConfigured(env)) throw new PinterestSyncError("Pinterest app secret is not configured", 503);
		if (body.batchId !== undefined && typeof body.batchId !== "string") {
			throw new PinterestSyncError("Invalid batch ID", 400);
		}
		const deletionIds = body.deletionIds ?? [];
		if (!Array.isArray(deletionIds) || deletionIds.length > 1000 || deletionIds.some((id) => typeof id !== "string" || !/^artwork-\d+$/.test(id))) {
			throw new PinterestSyncError("Invalid deletion IDs", 400);
		}
		const result = typeof body.batchId === "string"
			? await getPinterestBatchStatus(env, body.batchId, fetch, deletionIds)
			: await (async () => {
				const [artworks, ids] = await Promise.all([
					getAvailableArtworkCatalog(env), getArtworkCatalogIds(env),
				]);
				return syncPinterestCatalog(env, artworks, ids);
			})();
		return Response.json(result, { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		return Response.json(
			{ error: error instanceof PinterestSyncError ? error.message : "Pinterest sync failed" },
			{ status: error instanceof PinterestSyncError ? error.status : 502, headers: { "Cache-Control": "no-store" } },
		);
	}
};
