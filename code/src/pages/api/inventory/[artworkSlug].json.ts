import type { APIRoute } from "astro";
import { getInventoryRecordByArtworkSlug } from "../../../db/checkout";
import { handleInventoryRequest } from "../../../lib/inventory";
import { getRuntimeEnv } from "../../../lib/runtime-env";

export const prerender = false;
export const GET: APIRoute = async ({ params }) => {
	const artworkSlug = params.artworkSlug;
	if (!artworkSlug) return new Response("Not found", { status: 404 });
	const env = getRuntimeEnv();
	return handleInventoryRequest(artworkSlug, (slug) => getInventoryRecordByArtworkSlug(env, slug));
};
