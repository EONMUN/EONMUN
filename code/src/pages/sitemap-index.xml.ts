import type { APIRoute } from "astro";
import { renderSitemapIndexXml, SITEMAP_HEADERS } from "../lib/sitemap";

export const prerender = false;

export const GET: APIRoute = async ({ site }) =>
	new Response(renderSitemapIndexXml(["/sitemap.xml"], site), {
		headers: SITEMAP_HEADERS,
	});
