import {
	getAllArtworks,
	getArtworkBySlug,
	type ArtworkDetail,
	type ArtworkListItem,
} from "../db/queries";
import { getRuntimeEnv } from "./runtime-env";

export type PublicCollectionRef = ArtworkListItem["collections"][number];

export interface PublicArtworkEntry {
	id: string;
	body: string;
	data: {
		title: string;
		description: string | null;
		artist: string | null;
		year: number | null;
		width: number | null;
		height: number | null;
		depth: number | null;
		dimensionUnit: string | null;
		publishedAt: string;
		locale: string;
		images: { url: string; isDefault: boolean; caption: string | null }[];
	};
}

export interface PublishedArtworkDetail {
	artwork: PublicArtworkEntry;
	collections: PublicCollectionRef[];
	defaultImageUrl: string | null;
}

function toEntry(row: ArtworkListItem | ArtworkDetail): PublicArtworkEntry {
	return {
		id: row.slug,
		body: "",
		data: {
			title: row.title,
			description: row.description,
			artist: row.artist,
			year: row.year,
			width: row.width,
			height: row.height,
			depth: row.depth,
			dimensionUnit: row.dimensionUnit,
			publishedAt: row.publishedAt?.toISOString() ?? "",
			locale: row.locale,
			images: "images" in row ? row.images : [],
		},
	};
}

function toListDetail(row: ArtworkListItem): PublishedArtworkDetail {
	return {
		artwork: toEntry(row),
		collections: row.collections,
		defaultImageUrl: row.defaultImageUrl,
	};
}

export async function getPublishedArtworkEntries(collectionSlug?: string) {
	const rows = await getAllArtworks(getRuntimeEnv());
	return rows
		.filter((row) =>
			collectionSlug
				? row.collections.some((collection) => collection.slug === collectionSlug)
				: true,
		)
		.sort((left, right) =>
			(right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0) ||
			left.title.localeCompare(right.title),
		)
		.map(toListDetail);
}

export async function getPublishedArtworkDetailBySlug(
	slug: string,
): Promise<PublishedArtworkDetail | null> {
	const row = await getArtworkBySlug(getRuntimeEnv(), slug);
	if (!row || !row.publishedAt) return null;
	return {
		artwork: toEntry(row),
		collections: row.collections.map(({ id, slug: collectionSlug, name }) => ({
			id,
			slug: collectionSlug,
			name,
		})),
		defaultImageUrl: row.defaultImageUrl,
	};
}

export function getArtworkPublishedTime(artwork: PublicArtworkEntry) {
	return artwork.data.publishedAt || undefined;
}

export function getArtworkCollectionFilterOptions(artworks: PublishedArtworkDetail[]) {
	const collectionBySlug = new Map<string, PublicCollectionRef>();
	for (const detail of artworks) {
		for (const collection of detail.collections) {
			collectionBySlug.set(collection.slug, collection);
		}
	}
	return [...collectionBySlug.values()].sort((left, right) => left.name.localeCompare(right.name));
}
