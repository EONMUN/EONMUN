import type { APIContext } from "astro";

export const PUBLIC_CONTENT_TAG = "public-content";

// A short lifetime bounds staleness if a purge fails after a database write.
export const PUBLIC_CONTENT_RULE = {
	maxAge: 300,
	swr: 60,
	tags: [PUBLIC_CONTENT_TAG],
};

type CacheContext = Pick<APIContext, "cache" | "locals" | "request">;
type Loopback = { fetch(request: Request): Promise<Response> };

export async function refillPublicContent(
	cache: Pick<APIContext["cache"], "invalidate">,
	loopback: Loopback,
	requestUrl: string,
	getPaths: () => Promise<string[]>,
): Promise<void> {
	await cache.invalidate({ tags: [PUBLIC_CONTENT_TAG] });
	const paths = await getPaths();
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
	if (failures.length) throw new AggregateError(failures, "Could not warm every public page");
}

export async function refreshPublicContent({ cache, locals, request }: CacheContext): Promise<void> {
	if (!cache.enabled) return;
	try {
		const loopback = (locals.cfContext as { exports: { default: Loopback } }).exports.default;
		await refillPublicContent(cache, loopback, request.url, async () => {
			const [{ getPublishedArtworkEntries, getArtworkCollectionFilterOptions }, { getPublishedPostEntries, VALID_POST_TYPES }] = await Promise.all([
				import("./artwork-content"),
				import("./post-content"),
			]);
			const [artworks, posts] = await Promise.all([getPublishedArtworkEntries(), getPublishedPostEntries()]);
			const collections = getArtworkCollectionFilterOptions(artworks);
			return [
				"/", "/artworks", "/posts", "/sitemap.xml", "/sitemap-index.xml",
				...collections.map(({ slug }) => `/artworks?collection=${encodeURIComponent(slug)}`),
				...VALID_POST_TYPES.map((type) => `/posts?type=${type}`),
				...artworks.map(({ artwork }) => `/artworks/${encodeURIComponent(artwork.id)}`),
				...posts.map(({ id }) => `/posts/${encodeURIComponent(id)}`),
			];
		});
	} catch (error) {
		// The database write has already committed; reporting it as failed could make an admin repeat it.
		console.error("Could not refresh the public content cache", error);
	}
}
