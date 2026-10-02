export function selectRelatedBySlug<T>(
	requestedSlugs: string[],
	items: T[],
	getSlug: (item: T) => string,
) {
	const requested = new Set(requestedSlugs);
	return items.filter((item) => requested.has(getSlug(item)));
}

export function createArtworkSitemapEntries<T>(
	site: URL,
	items: T[],
	getSlug: (item: T) => string,
	getImages: (item: T) => string[],
) {
	return items.map((item) => ({
		loc: new URL(`/artworks/${encodeURIComponent(getSlug(item))}`, site).toString(),
		images: getImages(item),
	}));
}
