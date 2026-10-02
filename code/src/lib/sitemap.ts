import { getAllArtworks, getAllCollections, getPublishedArtworkImages } from "../db/queries";
import { getCollectionHref } from "./paths";
import { SITE_URL } from "../consts";
import { getPublishedPostEntries } from "./post-content";
import { getRuntimeEnv } from "./runtime-env";
import { createArtworkSitemapEntries } from "./public-catalog";

export interface SitemapEntry {
	loc: string;
	images?: string[];
}

const STATIC_PATHS = ["/", "/artworks", "/collections", "/contact", "/posts"];

export const SITEMAP_HEADERS = {
	"content-type": "application/xml; charset=utf-8",
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

export function getSiteUrl(site?: URL) {
	return site ?? new URL(SITE_URL);
}

export async function getSitemapEntries(site?: URL): Promise<SitemapEntry[]> {
	const baseUrl = getSiteUrl(site);
	const staticEntries = STATIC_PATHS.map((pathname) => ({
		loc: toAbsoluteUrl(baseUrl, pathname),
	}));
	const env = getRuntimeEnv();
	const [artworks, images, posts, collections] = await Promise.all([
		getAllArtworks(env),
		getPublishedArtworkImages(env),
		getPublishedPostEntries(),
		getAllCollections(env),
	]);
	const imagesByArtwork = new Map<string, Set<string>>();
	for (const { slug, url } of images) {
		try {
			if (!["http:", "https:"].includes(new URL(url).protocol)) continue;
		} catch {
			continue;
		}
		const artworkImages = imagesByArtwork.get(slug) ?? new Set<string>();
		artworkImages.add(url);
		imagesByArtwork.set(slug, artworkImages);
	}
	const postEntries = posts.map((post) => ({
		loc: toAbsoluteUrl(baseUrl, `/posts/${post.id}`),
	}));

	// Publication dates do not track later changes to pages or their structured data.
	return [
		...staticEntries,
		...postEntries,
		...collections.map((collection) => ({ loc: toAbsoluteUrl(baseUrl, getCollectionHref(collection.slug)) })),
		...createArtworkSitemapEntries(
			baseUrl,
			artworks,
			(artwork) => artwork.slug,
			(artwork) => [...(imagesByArtwork.get(artwork.slug) ?? [])],
		),
	];
}

export function renderSitemapXml(entries: SitemapEntry[]) {
	const urls = entries
		.map((entry) => {
			const images = entry.images
				?.map((image) => `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>`)
				.join("") ?? "";
			return `<url><loc>${escapeXml(entry.loc)}</loc>${images}</url>`;
		})
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`;
}

export function renderSitemapIndexXml(paths: string[], site?: URL) {
	const baseUrl = getSiteUrl(site);
	const body = paths
		.map((pathname) => `<sitemap><loc>${escapeXml(toAbsoluteUrl(baseUrl, pathname))}</loc></sitemap>`)
		.join("");

	return `<?xml version="1.0" encoding="UTF-8"?>` +
		`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}
