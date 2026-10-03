import type { APIContext } from "astro";
import type { getAdminArtwork, getAdminCollection } from "../db/admin";
import type { ArtworkAdminInput, CollectionAdminInput } from "./admin-input";

export const CACHE_TAGS = {
	home: "home",
	artworks: "artworks",
	posts: "posts",
	sitemap: "sitemap",
	artwork: (slug: string) => `artwork:${slug}`,
	collection: (slug: string) => `collection:${slug}`,
};

// A short lifetime bounds staleness if a purge fails after a database write.
export const PUBLIC_CONTENT_RULE = {
	maxAge: 300,
	swr: 60,
};
export const publicContentRule = (tag: string) => ({ ...PUBLIC_CONTENT_RULE, tags: [tag] });

export function artworkContentChanged(
	before: Awaited<ReturnType<typeof getAdminArtwork>>,
	input: ArtworkAdminInput,
): boolean {
	if (!before) return false;
	if ((before.publishedAt !== null) !== input.published) return true;
	if (!input.published) return false;
	const fields = ["slug", "title", "description", "artist", "year"] as const;
	if (fields.some((field) => before[field] !== input[field])) return true;
	if (JSON.stringify(before.tags) !== JSON.stringify(input.tags)) return true;
	if (input.newFacets.length > 0) return true;
	if (before.facetIds.slice().sort().join(",") !== input.facetIds.slice().sort().join(",")) return true;
	if (before.collectionIds.slice().sort().join(",") !== input.collectionIds.slice().sort().join(",")) return true;
	return JSON.stringify(before.images.map(({ url, caption, altText, isDefault }) => ({ url, caption, altText, isDefault }))) !==
		JSON.stringify(input.images);
}

export function collectionContentChanged(
	before: Awaited<ReturnType<typeof getAdminCollection>>,
	input: CollectionAdminInput,
): boolean {
	if (!before) return false;
	if ((before.publishedAt !== null) !== input.published) return true;
	if (!input.published) return false;
	if (before.slug !== input.slug || before.name !== input.name || before.description !== input.description) return true;
	if (before.defaultArtworkId !== input.defaultArtworkId) return true;
	return before.artworkIds.slice().sort().join(",") !== input.artworkIds.slice().sort().join(",");
}

type CacheContext = Pick<APIContext, "cache" | "locals" | "request">;
type Loopback = { fetch(request: Request): Promise<Response> };
type Change =
	| { kind: "artwork"; oldSlug: string; slug: string; published: boolean }
	| { kind: "collection"; oldSlug: string; slug: string; memberSlugs: string[] };

export interface RefreshPlan {
	tags: string[];
	paths: string[];
}

export function planPublicContentRefresh(
	change: Change,
	relatedPostSlugs: string[],
	publishedMemberSlugs: string[] = [],
): RefreshPlan {
	const affectedSlugs = [change.oldSlug, change.slug];
	const postPaths = relatedPostSlugs.map((slug) => `/posts/${encodeURIComponent(slug)}`);
	if (change.kind === "artwork") {
		return {
			tags: [
				CACHE_TAGS.home, CACHE_TAGS.artworks, CACHE_TAGS.sitemap,
				...affectedSlugs.map(CACHE_TAGS.artwork),
				...(relatedPostSlugs.length ? [CACHE_TAGS.posts] : []),
			],
			paths: [
				"/", "/artworks", "/sitemap.xml",
				...(change.published ? [`/artworks/${encodeURIComponent(change.slug)}`] : []),
				...(relatedPostSlugs.length ? ["/posts"] : []),
				...postPaths,
			],
		};
	}
	return {
		tags: [
			CACHE_TAGS.home, CACHE_TAGS.artworks, CACHE_TAGS.sitemap,
			...affectedSlugs.map(CACHE_TAGS.collection),
			...change.memberSlugs.map(CACHE_TAGS.artwork),
		],
		paths: [
			"/", "/artworks", "/sitemap.xml",
			...publishedMemberSlugs.map((slug) => `/artworks/${encodeURIComponent(slug)}`),
			...postPaths,
		],
	};
}

export async function refillPublicContent(
	cache: Pick<APIContext["cache"], "invalidate">,
	loopback: Loopback,
	requestUrl: string,
	plan: RefreshPlan,
): Promise<void> {
	const tags = [...new Set(plan.tags)];
	// Cloudflare accepts at most 100 tags per purge request.
	for (let index = 0; index < tags.length; index += 100) {
		await cache.invalidate({ tags: tags.slice(index, index + 100) });
	}
	const paths = [...new Set(plan.paths)];
	const failures: unknown[] = [];
	for (let index = 0; index < paths.length; index += 6) {
		const results = await Promise.allSettled(paths.slice(index, index + 6).map(async (path) => {
			const response = await loopback.fetch(new Request(new URL(path, requestUrl)));
			if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
			await response.arrayBuffer();
		}));
		for (const result of results) {
			if (result.status === "rejected") failures.push(result.reason);
		}
	}
	if (failures.length) throw new AggregateError(failures, "Could not warm every affected public page");
}

export async function refreshPublicContent({ cache, locals, request }: CacheContext, change: Change): Promise<void> {
	if (!cache.enabled) return;
	try {
		const { getPublishedPostEntries } = await import("./post-content");
		const posts = await getPublishedPostEntries();
		const affectedSlugs = [change.oldSlug, change.slug];
		const relatedPosts = posts.filter((post) => change.kind === "artwork"
			? post.data.artworkSlugs.some((slug) => affectedSlugs.includes(slug))
			: post.data.collectionSlugs.some((slug) => affectedSlugs.includes(slug)));
		let publishedMemberSlugs: string[] = [];
		if (change.kind === "collection") {
			const { getPublishedArtworkEntries } = await import("./artwork-content");
			const publishedSlugs = new Set((await getPublishedArtworkEntries()).map(({ artwork }) => artwork.id));
			publishedMemberSlugs = change.memberSlugs.filter((slug) => publishedSlugs.has(slug));
		}
		const loopback = (locals.cfContext as { exports: { default: Loopback } }).exports.default;
		await refillPublicContent(
			cache, loopback, request.url,
			planPublicContentRefresh(change, relatedPosts.map((post) => post.id), publishedMemberSlugs),
		);
	} catch (error) {
		// The database write has already committed; reporting it as failed could make an admin repeat it.
		console.error("Could not refresh the public content cache", error);
	}
}
