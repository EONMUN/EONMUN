export function selectRelatedBySlug<T>(
	requestedSlugs: string[],
	items: T[],
	getSlug: (item: T) => string,
) {
	const requested = new Set(requestedSlugs);
	return items.filter((item) => requested.has(getSlug(item)));
}
