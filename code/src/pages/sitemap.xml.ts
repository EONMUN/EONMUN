import type { APIRoute } from "astro";
import { getSitemapEntries, renderSitemapXml, SITEMAP_HEADERS } from "../lib/sitemap";

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
	const entries = await getSitemapEntries(site);

	return new Response(renderSitemapXml(entries), {
		headers: SITEMAP_HEADERS,
	});
};
