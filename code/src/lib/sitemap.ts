import { SITE_URL } from "../consts";
import type { Env } from "../db";
import {
	getAllArtworks,
	getAvailableProducts,
} from "../db/queries";
import {
	getPostPublishedTime,
	getPublishedPostEntries,
} from "./post-content";

export interface SitemapEntry {
	loc: string;
	lastmod?: string;
}

const SITEMAP_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

const STATIC_PATHS = [
	"/",
	"/artworks",
	"/contact",
	"/posts",
	"/store",
];

export const SITEMAP_HEADERS = {
	"content-type": "application/xml; charset=utf-8",
	"cache-control": SITEMAP_CACHE_CONTROL,
};

function escapeXml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");
}

function toAbsoluteUrl(site: URL, pathname: string) {
	return new URL(pathname, site).toString();
}

function toLastModified(value: Date | string | null | undefined) {
	if (!value) return undefined;
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.toISOString();
}

export function getSiteUrl(site?: URL) {
	return site ?? new URL(SITE_URL);
}

export async function getSitemapEntries(env: Env, site?: URL): Promise<SitemapEntry[]> {
	const baseUrl = getSiteUrl(site);
	const staticEntries = STATIC_PATHS.map((pathname) => ({
		loc: toAbsoluteUrl(baseUrl, pathname),
	}));
	const posts = await getPublishedPostEntries();
	const postEntries = posts.map((post) => ({
		loc: toAbsoluteUrl(baseUrl, `/posts/${post.id}`),
		lastmod: getPostPublishedTime(post),
	}));

	try {
		const [artworks, products] = await Promise.all([
			getAllArtworks(env),
			getAvailableProducts(env),
		]);

		return [
			...staticEntries,
			...postEntries,
			...artworks.map((artwork) => ({
				loc: toAbsoluteUrl(baseUrl, `/artworks/${artwork.slug}`),
				lastmod: toLastModified(artwork.updatedAt ?? artwork.publishedAt),
			})),
			...products.map((product) => ({
				loc: toAbsoluteUrl(baseUrl, `/store/${product.slug}`),
				lastmod: toLastModified(product.updatedAt ?? product.createdAt),
			})),
		];
	} catch (error) {
		if (error instanceof Error && error.message.includes("TURSO_DATABASE_URL is not set")) {
			return [...staticEntries, ...postEntries];
		}
		console.error("Error generating sitemap:", error);
		return [...staticEntries, ...postEntries];
	}
}

export function renderSitemapXml(entries: SitemapEntry[]) {
	const urls = entries
		.map((entry) => {
			const lastmod = entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "";
			return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
		})
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function renderSitemapIndexXml(paths: string[], site?: URL) {
	const baseUrl = getSiteUrl(site);
	const body = paths
		.map((pathname) => `<sitemap><loc>${escapeXml(toAbsoluteUrl(baseUrl, pathname))}</loc></sitemap>`)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>` +
		`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
