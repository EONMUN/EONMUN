export function getCollectionHref(slug: string) {
	return `/collections/${encodeURIComponent(slug)}`;
}

export function getArtworkHref(slug: string, collectionSlug?: string) {
	const path = `/artworks/${encodeURIComponent(slug)}`;
	return collectionSlug ? `${path}?${new URLSearchParams({ collection: collectionSlug })}` : path;
}
