import { getCollection, type CollectionEntry } from "astro:content";

export type CollectionEntryType = CollectionEntry<"collections">;

export interface PublicCollectionRef {
	name: string;
	slug: string;
	description: string | null;
	publishedAt: string;
	locale: string;
}

function parseEntryDate(value: string | null | undefined) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function isPublishedCollection(collection: CollectionEntryType, now = new Date()) {
	const publishedAt = parseEntryDate(collection.data.publishedAt);
	return publishedAt ? publishedAt <= now : false;
}

export function toPublicCollectionRef(collection: CollectionEntryType): PublicCollectionRef {
	return {
		name: collection.data.name,
		slug: collection.id,
		description: collection.data.description ?? null,
		publishedAt: collection.data.publishedAt ?? "",
		locale: collection.data.locale,
	};
}

export async function getPublishedCollectionEntries() {
	const collections = await getCollection("collections");
	return collections
		.filter((collection) => isPublishedCollection(collection))
		.sort((left, right) => left.data.name.localeCompare(right.data.name));
}

export async function getPublishedCollectionRefs() {
	const collections = await getPublishedCollectionEntries();
	return collections.map(toPublicCollectionRef);
}

export async function getPublishedCollectionsBySlugs(slugs: string[]) {
	const requestedSlugs = new Set(slugs);
	const collections = await getPublishedCollectionRefs();
	return collections.filter((collection) => requestedSlugs.has(collection.slug));
}
