export function getArtworkCollectionHref(slug: string) {
	const params = new URLSearchParams({ collection: slug });
	return `/artworks?${params.toString()}`;
}
