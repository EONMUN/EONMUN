import type { APIRoute } from "astro";
import { getAdminArtwork } from "../../../../../db/admin";
import { requireAdminMutation } from "../../../../../lib/admin-guard";
import { getArtworkListingStatus } from "../../../../../lib/artwork-listing-status";
import { getRuntimeEnv } from "../../../../../lib/runtime-env";

export const prerender = false;

export const POST: APIRoute = async ({ request, params }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) {
		guard.response.headers.set("Cache-Control", "no-store");
		return guard.response;
	}
	const headers = { "Cache-Control": "no-store" };
	if (!params.slug) return Response.json({ error: "Artwork not found" }, { status: 404, headers });
	const artwork = await getAdminArtwork(env, params.slug);
	if (!artwork) return Response.json({ error: "Artwork not found" }, { status: 404, headers });
	let body: { pinterestBatchId?: unknown; pinterestDeletion?: unknown };
	try { body = await request.json(); }
	catch { return Response.json({ error: "Invalid status request" }, { status: 400, headers }); }
	if (!body || typeof body !== "object" || Array.isArray(body) || (body.pinterestBatchId !== undefined && (typeof body.pinterestBatchId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(body.pinterestBatchId)))
		|| (body.pinterestDeletion !== undefined && typeof body.pinterestDeletion !== "boolean")) {
		return Response.json({ error: "Invalid Pinterest batch" }, { status: 400, headers });
	}
	const batch = typeof body.pinterestBatchId === "string" ? { id: body.pinterestBatchId, deletion: body.pinterestDeletion === true } : undefined;
	const apiFetch: typeof fetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) });
	return Response.json(await getArtworkListingStatus(env, artwork.id, batch, apiFetch), { headers });
};
