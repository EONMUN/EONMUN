import { and, eq, inArray } from "drizzle-orm";

import type { ArtworkAdminInput, CollectionAdminInput } from "../lib/admin-input";
import {
	artworkImages,
	artworks,
	artworksToCollections,
	collections,
	getDb,
	products,
	type Database,
	type Env,
} from "./index";

async function validateIds(
	db: ReturnType<typeof getDb>,
	table: typeof artworks | typeof collections,
	requestedIds: number[],
	label: string,
) {
	if (requestedIds.length === 0) return;
	const rows = await db.select({ id: table.id }).from(table).where(inArray(table.id, requestedIds));
	if (rows.length !== requestedIds.length) throw new Error(`One or more ${label} do not exist`);
}

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

function artworkValues(input: ArtworkAdminInput) {
	return {
		title: input.title,
		slug: input.slug,
		description: input.description,
		artist: input.artist,
		year: input.year,
		width: input.width,
		height: input.height,
		depth: input.depth,
		dimensionUnit: input.dimensionUnit,
		updatedAt: new Date(),
	};
}

function collectionValues(input: CollectionAdminInput) {
	return {
		name: input.name,
		slug: input.slug,
		description: input.description,
		updatedAt: new Date(),
	};
}

function defaultImageUrl(input: ArtworkAdminInput) {
	return input.images.find((image) => image.isDefault)?.url ?? input.images[0]?.url ?? null;
}

// The junction row set is always replaced wholesale so the caller's list is the
// single source of truth for membership and the derived cover.
async function replaceMemberships(
	tx: Transaction,
	column: typeof artworksToCollections.artworkId | typeof artworksToCollections.collectionId,
	id: number,
	rows: { artworkId: number; collectionId: number; isDefaultForCollection?: boolean }[],
) {
	await tx.delete(artworksToCollections).where(eq(column, id));
	if (rows.length) await tx.insert(artworksToCollections).values(rows);
}

export async function createArtworkAdmin(env: Env, input: ArtworkAdminInput, db = getDb(env)) {
	await validateIds(db, collections, input.collectionIds, "collections");
	return db.transaction(async (tx) => {
		const [artwork] = await tx.insert(artworks).values({
			...artworkValues(input),
			publishedAt: null,
		}).returning();
		if (input.images.length) {
			await tx.insert(artworkImages).values(input.images.map((image) => ({ ...image, artworkId: artwork.id })));
		}
		if (input.collectionIds.length) {
			await tx.insert(artworksToCollections).values(
				input.collectionIds.map((collectionId) => ({ artworkId: artwork.id, collectionId })),
			);
		}
		if (input.priceCents !== null) {
			await tx.insert(products).values({
				type: "artwork",
				artworkId: artwork.id,
				name: artwork.title,
				slug: artwork.slug,
				description: artwork.description,
				imageUrl: defaultImageUrl(input),
				price: input.priceCents,
				quantity: input.available ? 1 : 0,
				updatedAt: new Date(),
			});
		}
		return artwork;
	});
}

export async function updateArtworkAdmin(env: Env, currentSlug: string, input: ArtworkAdminInput, db = getDb(env)) {
	await validateIds(db, collections, input.collectionIds, "collections");
	return db.transaction(async (tx) => {
		const [current] = await tx.select().from(artworks).where(eq(artworks.slug, currentSlug));
		if (!current) throw new Error("Artwork not found");
		const [artwork] = await tx.update(artworks).set({
			...artworkValues(input),
			publishedAt: input.published ? (current.publishedAt ?? new Date()) : null,
		}).where(eq(artworks.id, current.id)).returning();

		await tx.delete(artworkImages).where(eq(artworkImages.artworkId, current.id));
		if (input.images.length) {
			await tx.insert(artworkImages).values(input.images.map((image) => ({ ...image, artworkId: current.id })));
		}
		const existingMemberships = await tx
			.select()
			.from(artworksToCollections)
			.where(eq(artworksToCollections.artworkId, current.id));
		const coverCollectionIds = new Set(
			existingMemberships
				.filter((membership) => membership.isDefaultForCollection)
				.map((membership) => membership.collectionId),
		);
		await replaceMemberships(
			tx,
			artworksToCollections.artworkId,
			current.id,
			input.collectionIds.map((collectionId) => ({
				artworkId: current.id,
				collectionId,
				// Collection cover selection belongs exclusively to the collection editor.
				isDefaultForCollection: coverCollectionIds.has(collectionId),
			})),
		);

		const [product] = await tx.select().from(products).where(
			and(eq(products.artworkId, current.id), eq(products.type, "artwork")),
		);
		const productValues = {
			name: artwork.title,
			slug: artwork.slug,
			description: artwork.description,
			imageUrl: defaultImageUrl(input),
			quantity: input.available ? 1 : 0,
			updatedAt: new Date(),
		};
		if (product) {
			await tx.update(products).set({
				...productValues,
				...(input.priceCents === null ? {} : { price: input.priceCents }),
			}).where(eq(products.id, product.id));
		} else if (input.priceCents !== null) {
			await tx.insert(products).values({
				...productValues,
				type: "artwork",
				artworkId: current.id,
				price: input.priceCents,
			});
		} else if (input.available) {
			throw new Error("A private price is required when artwork is available");
		}
		return artwork;
	});
}

export async function createCollectionAdmin(env: Env, input: CollectionAdminInput, db = getDb(env)) {
	await validateIds(db, artworks, input.artworkIds, "artworks");
	return db.transaction(async (tx) => {
		const [collection] = await tx.insert(collections).values({
			...collectionValues(input),
			publishedAt: null,
		}).returning();
		if (input.artworkIds.length) {
			await tx.insert(artworksToCollections).values(input.artworkIds.map((artworkId) => ({
				artworkId,
				collectionId: collection.id,
				isDefaultForCollection: artworkId === input.defaultArtworkId,
			})));
		}
		return collection;
	});
}

export async function updateCollectionAdmin(env: Env, currentSlug: string, input: CollectionAdminInput, db = getDb(env)) {
	await validateIds(db, artworks, input.artworkIds, "artworks");
	return db.transaction(async (tx) => {
		const [current] = await tx.select().from(collections).where(eq(collections.slug, currentSlug));
		if (!current) throw new Error("Collection not found");
		const [collection] = await tx.update(collections).set({
			...collectionValues(input),
			publishedAt: input.published ? (current.publishedAt ?? new Date()) : null,
		}).where(eq(collections.id, current.id)).returning();
		await replaceMemberships(tx, artworksToCollections.collectionId, current.id,
			input.artworkIds.map((artworkId) => ({
				artworkId,
				collectionId: current.id,
				isDefaultForCollection: artworkId === input.defaultArtworkId,
			})));
		return collection;
	});
}

export async function getAdminArtworks(env: Env) {
	return getDb(env).select().from(artworks).orderBy(artworks.title);
}

export async function getAdminCollections(env: Env) {
	return getDb(env).select().from(collections).orderBy(collections.name);
}

export async function getAdminArtwork(env: Env, slug: string) {
	const db = getDb(env);
	const [artwork] = await db.select().from(artworks).where(eq(artworks.slug, slug));
	if (!artwork) return null;
	const [images, memberships, productRows] = await Promise.all([
		db.select().from(artworkImages).where(eq(artworkImages.artworkId, artwork.id)),
		db.select().from(artworksToCollections).where(eq(artworksToCollections.artworkId, artwork.id)),
		db.select().from(products).where(and(eq(products.artworkId, artwork.id), eq(products.type, "artwork"))),
	]);
	return { ...artwork, images, collectionIds: memberships.map((row) => row.collectionId), product: productRows[0] ?? null };
}

export async function getAdminCollection(env: Env, slug: string) {
	const db = getDb(env);
	const [collection] = await db.select().from(collections).where(eq(collections.slug, slug));
	if (!collection) return null;
	const memberships = await db.select().from(artworksToCollections).where(eq(artworksToCollections.collectionId, collection.id));
	return {
		...collection,
		artworkIds: memberships.map((row) => row.artworkId),
		defaultArtworkId: memberships.find((row) => row.isDefaultForCollection)?.artworkId ?? null,
	};
}
