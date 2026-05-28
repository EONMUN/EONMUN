import { getCollection, type CollectionEntry } from "astro:content";

import {
	getPublishedCollectionsBySlugs,
	type PublicCollectionRef,
} from "./collection-content";
import {
	getPublishedProductByArtworkSlug,
	type ProductEntry,
} from "./product-content";

export type ArtworkEntry = CollectionEntry<"artworks">;

export interface PublishedArtworkDetail {
	artwork: ArtworkEntry;
	collections: PublicCollectionRef[];
	product: ProductEntry | null;
	defaultImageUrl: string | null;
}

function parseEntryDate(value: string | null | undefined) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function getArtworkPublishedDate(artwork: ArtworkEntry) {
	return parseEntryDate(artwork.data.publishedAt);
}

export function getArtworkPublishedTime(artwork: ArtworkEntry) {
	return getArtworkPublishedDate(artwork)?.toISOString();
}

export function isPublishedArtwork(artwork: ArtworkEntry, now = new Date()) {
	const publishedAt = getArtworkPublishedDate(artwork);
	return publishedAt ? publishedAt <= now : false;
}

export async function getArtworkCollections(artwork: ArtworkEntry) {
	return getPublishedCollectionsBySlugs(artwork.data.collectionSlugs);
}

export function getArtworkDefaultImage(artwork: ArtworkEntry) {
	return artwork.data.images.find((image) => image.isDefault)?.url ?? artwork.data.images[0]?.url ?? null;
}

export async function getArtworkProduct(artwork: ArtworkEntry) {
	return getPublishedProductByArtworkSlug(artwork.id);
}

async function toPublishedArtworkDetail(artwork: ArtworkEntry): Promise<PublishedArtworkDetail> {
	return {
		artwork,
		collections: await getArtworkCollections(artwork),
		product: await getArtworkProduct(artwork),
		defaultImageUrl: getArtworkDefaultImage(artwork),
	};
}

export async function getPublishedArtworkEntries(collectionSlug?: string) {
	const artworks = await getCollection("artworks");

	const details = await Promise.all(
		artworks
		.filter((artwork) => isPublishedArtwork(artwork))
			.map(toPublishedArtworkDetail),
	);

	return details
		.filter((detail) =>
			collectionSlug
				? detail.collections.some((collection) => collection.slug === collectionSlug)
				: true,
		)
		.sort((left, right) => {
			const leftTime = getArtworkPublishedDate(left.artwork)?.getTime() ?? 0;
			const rightTime = getArtworkPublishedDate(right.artwork)?.getTime() ?? 0;

			if (leftTime !== rightTime) {
				return rightTime - leftTime;
			}

			return left.artwork.data.title.localeCompare(right.artwork.data.title);
		});
}

export async function getPublishedArtworkDetailBySlug(
	slug: string,
): Promise<PublishedArtworkDetail | null> {
	const artworks = await getPublishedArtworkEntries();
	return artworks.find((detail) => detail.artwork.id === slug) ?? null;
}

export function getArtworkCollectionFilterOptions(artworks: PublishedArtworkDetail[]) {
	const collectionBySlug = new Map<string, PublicCollectionRef>();

	for (const detail of artworks) {
		for (const collection of detail.collections) {
			if (!collectionBySlug.has(collection.slug)) {
				collectionBySlug.set(collection.slug, collection);
			}
		}
	}

	return Array.from(collectionBySlug.values()).sort((left, right) =>
		left.name.localeCompare(right.name),
	);
}
