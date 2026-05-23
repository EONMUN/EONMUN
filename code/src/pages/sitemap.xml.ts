import type { APIRoute } from "astro";
import { env as workerEnv } from "cloudflare:workers";
import type { Env } from "../db";
import { getSitemapEntries, renderSitemapXml, SITEMAP_HEADERS } from "../lib/sitemap";

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
	const entries = await getSitemapEntries(workerEnv as Env, site);

	return new Response(renderSitemapXml(entries), {
		headers: SITEMAP_HEADERS,
	});
};
