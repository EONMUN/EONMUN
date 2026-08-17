import { and, desc, eq, inArray, sql } from "drizzle-orm";

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

// Dashboard shapes. The dashboard is the only admin surface that reads every
// entity at once, so it keeps its own narrow projections instead of loading the
// full rows the editors need.
export interface DashboardCollection {
	slug: string;
	name: string;
	publishedAt: Date | null;
	artworkCount: number;
	coverUrls: string[];
}

export interface DashboardProduct {
	slug: string;
	name: string;
	priceCents: number;
	imageUrl: string | null;
	artworkSlug: string | null;
	soldAt: Date | null;
	quantity: number | null;
}

export interface DashboardTally {
	total: number;
	published: number;
}

export interface AdminDashboard {
	artworks: { recent: AdminArtworkCard[]; tally: DashboardTally };
	collections: { recent: DashboardCollection[]; tally: DashboardTally };
	store: {
		recent: DashboardProduct[];
		tally: { total: number; available: number; sold: number };
	};
}

const DASHBOARD_LIMIT = 3;
// CoverStack.astro styles exactly three fanned layers.
const COLLECTION_COVER_LAYERS = 3;

// sum() over zero rows is NULL in SQLite, and an ungrouped aggregate always
// returns a row, so every conditional count needs its own coalesce.
const publishedTally = (column: typeof artworks.publishedAt | typeof collections.publishedAt) => ({
	total: sql<number>`count(*)`,
	published: sql<number>`coalesce(sum(case when ${column} is not null then 1 else 0 end), 0)`,
});

// admin-input.ts rejects a second default and promotes the first image when no
// image is flagged, so an artwork with images has exactly one default row.
// Joining on that flag returns one row per artwork, which is why nothing below
// folds images together in JavaScript.
const onDefaultImage = (artworkId: typeof artworks.id | typeof artworksToCollections.artworkId) =>
	and(eq(artworkImages.artworkId, artworkId), eq(artworkImages.isDefault, true));

const artworkCardColumns = {
	slug: artworks.slug,
	title: artworks.title,
	year: artworks.year,
	publishedAt: artworks.publishedAt,
	imageUrl: artworkImages.url,
};

export type AdminArtworkCard = {
	slug: string;
	title: string;
	year: number | null;
	publishedAt: Date | null;
	imageUrl: string | null;
};

type CollectionRow = typeof collections.$inferSelect;
type MemberRow = { collectionId: number; isCover: boolean; url: string | null };

// A collection has no image of its own, so its cover comes from the artwork it
// holds, with the collection's chosen cover piece promoted to the front.
async function withCovers(db: Database, rows: CollectionRow[]): Promise<DashboardCollection[]> {
	const collectionIds = rows.map((collection) => collection.id);
	const members: MemberRow[] = collectionIds.length
		? await db
				.select({
					collectionId: artworksToCollections.collectionId,
					isCover: artworksToCollections.isDefaultForCollection,
					url: artworkImages.url,
				})
				.from(artworksToCollections)
				.leftJoin(artworkImages, onDefaultImage(artworksToCollections.artworkId))
				.where(inArray(artworksToCollections.collectionId, collectionIds))
		: [];

	const byCollection = new Map<number, MemberRow[]>();
	for (const member of members) {
		const bucket = byCollection.get(member.collectionId) ?? [];
		bucket.push(member);
		byCollection.set(member.collectionId, bucket);
	}

	return rows.map((collection) => {
		const memberRows = byCollection.get(collection.id) ?? [];
		return {
			slug: collection.slug,
			name: collection.name,
			publishedAt: collection.publishedAt,
			artworkCount: memberRows.length,
			coverUrls: memberRows
				.slice()
				.sort((left, right) => Number(right.isCover) - Number(left.isCover))
				.map((member) => member.url)
				.filter((url): url is string => url !== null)
				.slice(0, COLLECTION_COVER_LAYERS),
		};
	});
}

// The list pages show every row with its cover; the dashboard shows the newest
// few. Both read the same shapes.
export async function getAdminArtworkCards(env: Env, db = getDb(env)): Promise<AdminArtworkCard[]> {
	return db
		.select(artworkCardColumns)
		.from(artworks)
		.leftJoin(artworkImages, onDefaultImage(artworks.id))
		.orderBy(artworks.title);
}

export async function getAdminCollectionCards(env: Env, db = getDb(env)): Promise<DashboardCollection[]> {
	const rows = await db.select().from(collections).orderBy(collections.name);
	return withCovers(db, rows);
}

export async function getAdminDashboard(env: Env, db = getDb(env)): Promise<AdminDashboard> {
	const [artworkRows, collectionRows, productRows, artworkTally, collectionTally, storeTally] =
		await Promise.all([
			// created_at holds whole seconds, so rows written in the same second
			// tie; the autoincrement id breaks the tie in insertion order.
			db
				.select(artworkCardColumns)
				.from(artworks)
				.leftJoin(artworkImages, onDefaultImage(artworks.id))
				.orderBy(desc(artworks.createdAt), desc(artworks.id))
				.limit(DASHBOARD_LIMIT),
			db.select().from(collections).orderBy(desc(collections.createdAt), desc(collections.id)).limit(DASHBOARD_LIMIT),
			db.select().from(products).orderBy(desc(products.createdAt), desc(products.id)).limit(DASHBOARD_LIMIT),
			db.select(publishedTally(artworks.publishedAt)).from(artworks),
			db.select(publishedTally(collections.publishedAt)).from(collections),
			db
				.select({
					total: sql<number>`count(*)`,
					available: sql<number>`coalesce(sum(case when ${products.soldAt} is null and coalesce(${products.quantity}, 0) > 0 then 1 else 0 end), 0)`,
					sold: sql<number>`coalesce(sum(case when ${products.soldAt} is not null then 1 else 0 end), 0)`,
				})
				.from(products),
		]);

	// A product is edited through its artwork, so each card needs the artwork slug.
	const productArtworkIds = productRows
		.map((product) => product.artworkId)
		.filter((id): id is number => id !== null);

	const [recentCollections, productArtworkRows] = await Promise.all([
		withCovers(db, collectionRows),
		productArtworkIds.length
			? db
					.select({ id: artworks.id, slug: artworks.slug })
					.from(artworks)
					.where(inArray(artworks.id, productArtworkIds))
			: Promise.resolve([] as { id: number; slug: string }[]),
	]);

	const artworkSlugById = new Map(productArtworkRows.map((row) => [row.id, row.slug]));

	return {
		artworks: {
			recent: artworkRows,
			tally: artworkTally[0] ?? { total: 0, published: 0 },
		},
		collections: {
			recent: recentCollections,
			tally: collectionTally[0] ?? { total: 0, published: 0 },
		},
		store: {
			recent: productRows.map((product) => ({
				slug: product.slug,
				name: product.name,
				priceCents: product.price,
				imageUrl: product.imageUrl,
				artworkSlug: product.artworkId === null ? null : artworkSlugById.get(product.artworkId) ?? null,
				soldAt: product.soldAt,
				quantity: product.quantity,
			})),
			tally: storeTally[0] ?? { total: 0, available: 0, sold: 0 },
		},
	};
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
