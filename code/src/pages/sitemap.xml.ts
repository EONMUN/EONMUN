import type { APIRoute } from "astro";
import { getSitemapEntries, renderSitemapXml, SITEMAP_HEADERS } from "../lib/sitemap";
import { getRuntimeEnv } from "../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
	const entries = await getSitemapEntries(getRuntimeEnv(), site);

	return new Response(renderSitemapXml(entries), {
		headers: SITEMAP_HEADERS,
	});
};
