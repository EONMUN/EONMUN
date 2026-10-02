import type { APIRoute } from "astro";
import { getAvailableArtworkCatalog } from "../db/catalog";
import { renderPinterestFeed } from "../lib/pinterest-feed";
import { getRuntimeEnv } from "../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
	const artworks = await getAvailableArtworkCatalog(getRuntimeEnv());
	return new Response(renderPinterestFeed(artworks, site ?? new URL("https://eonmun.com")), {
		headers: {
		"Content-Type": "text/csv; charset=utf-8",
		"Cache-Control": "no-store",
		"Content-Disposition": 'inline; filename="pinterest-catalog.csv"',
		"X-Content-Type-Options": "nosniff",
		},
	});
};
