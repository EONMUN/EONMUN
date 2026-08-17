import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import * as schema from "../src/db/schema";
import {
	createArtworkAdmin,
	createCollectionAdmin,
	updateArtworkAdmin,
	updateCollectionAdmin,
} from "../src/db/admin";
import { getAllArtworks, getHomepageSlides } from "../src/db/queries";
import { markArtworkPaid } from "../src/db/checkout";
import { artworks, artworksToCollections, homepageArtworks, products } from "../src/db";
import { parseArtworkInput, parseCollectionInput } from "../src/lib/admin-input";
import { createArtworkSitemapEntries, selectRelatedBySlug } from "../src/lib/public-catalog";

const env = { TURSO_DATABASE_URL: "https://unused.test" };
let client: Client;
let db: ReturnType<typeof drizzle<typeof schema>>;
let databasePath: string;

const artworkInput = (overrides: Record<string, unknown> = {}) => parseArtworkInput({
	title: "Study",
	slug: "study",
	description: "A study",
	artist: "EONMUN",
	year: 2026,
	width: 10,
	height: 12,
	depth: "",
	dimensionUnit: "in",
	published: false,
	available: false,
	priceCents: "",
	collectionIds: [],
	images: [],
	...overrides,
});

beforeEach(async () => {
	databasePath = `/tmp/eonmun-admin-test-${crypto.randomUUID()}.db`;
	client = createClient({ url: `file:${databasePath}` });
	db = drizzle(client, { schema });
	await client.executeMultiple(`
		CREATE TABLE collections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, published_at INTEGER, locale TEXT NOT NULL DEFAULT 'en', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
		CREATE TABLE artworks (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, artist TEXT, year INTEGER, width REAL, height REAL, depth REAL, dimension_unit TEXT DEFAULT 'in', published_at INTEGER, locale TEXT NOT NULL DEFAULT 'en', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
		CREATE TABLE artwork_images (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE, url TEXT NOT NULL, caption TEXT, is_default INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
		CREATE UNIQUE INDEX artwork_images_one_default_per_artwork ON artwork_images(artwork_id) WHERE is_default = 1;
		CREATE TABLE artworks_to_collections (artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE, collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE, is_default_for_collection INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, PRIMARY KEY(artwork_id, collection_id));
		CREATE UNIQUE INDEX artwork_collection_one_default_per_collection ON artworks_to_collections(collection_id) WHERE is_default_for_collection = 1;
		CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, artwork_id INTEGER REFERENCES artworks(id) ON DELETE SET NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT, image_url TEXT, price INTEGER NOT NULL, quantity INTEGER, listed_at INTEGER NOT NULL, sold_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
		CREATE TABLE homepage_artworks (id INTEGER PRIMARY KEY AUTOINCREMENT, artwork_id INTEGER NOT NULL REFERENCES artworks(id) ON DELETE CASCADE, position INTEGER NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
	`);
});

afterEach(async () => {
	client.close();
	await unlink(databasePath).catch(() => undefined);
});

describe("admin mutations", () => {
	test("creates drafts, edits, publishes, and unpublishes artwork", async () => {
		const created = await createArtworkAdmin(env, artworkInput({ published: true }), db);
		expect(created.publishedAt).toBeNull();
		const published = await updateArtworkAdmin(env, created.slug, artworkInput({ title: "Edited", published: true }), db);
		expect(published.title).toBe("Edited");
		expect(published.publishedAt).toBeInstanceOf(Date);
		const draft = await updateArtworkAdmin(env, published.slug, artworkInput({ title: "Edited", published: false }), db);
		expect(draft.publishedAt).toBeNull();
	});

	test("rejects slug conflicts", async () => {
		await createArtworkAdmin(env, artworkInput(), db);
		await expect(createArtworkAdmin(env, artworkInput({ title: "Other" }), db)).rejects.toThrow();
	});

	test("uses quantity as the sale toggle and retains the private price", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput({ available: true, priceCents: 125000 }), db);
		let [product] = await db.select().from(products).where(eq(products.artworkId, artwork.id));
		expect(product.quantity).toBe(1);
		expect(product.price).toBe(125000);

		await updateArtworkAdmin(env, artwork.slug, artworkInput({ available: false, priceCents: "" }), db);
		[product] = await db.select().from(products).where(eq(products.artworkId, artwork.id));
		expect(product.quantity).toBe(0);
		expect(product.price).toBe(125000);
	});

	test("updates collection membership and the derived cover relationship", async () => {
		const first = await createArtworkAdmin(env, artworkInput(), db);
		const second = await createArtworkAdmin(env, artworkInput({ title: "Second", slug: "second" }), db);
		const created = await createCollectionAdmin(env, parseCollectionInput({ name: "Group", slug: "group", published: true, artworkIds: [first.id], defaultArtworkId: first.id }), db);
		expect(created.publishedAt).toBeNull();
		const updated = await updateCollectionAdmin(env, created.slug, parseCollectionInput({ name: "Group edited", slug: "group", published: true, artworkIds: [first.id, second.id], defaultArtworkId: second.id }), db);
		expect(updated.publishedAt).toBeInstanceOf(Date);
		const memberships = await db.select().from(artworksToCollections).where(eq(artworksToCollections.collectionId, created.id));
		expect(memberships).toHaveLength(2);
		expect(memberships.find((row) => row.isDefaultForCollection)?.artworkId).toBe(second.id);
	});

	test("preserves a collection cover when its artwork is edited", async () => {
		const cover = await createArtworkAdmin(env, artworkInput(), db);
		const other = await createArtworkAdmin(env, artworkInput({ title: "Other", slug: "other" }), db);
		const collection = await createCollectionAdmin(env, parseCollectionInput({
			name: "Group",
			slug: "group",
			artworkIds: [cover.id, other.id],
			defaultArtworkId: cover.id,
		}), db);

		await updateArtworkAdmin(env, cover.slug, artworkInput({
			title: "Edited cover",
			collectionIds: [collection.id],
		}), db);

		const [membership] = await db.select().from(artworksToCollections).where(
			eq(artworksToCollections.artworkId, cover.id),
		);
		expect(membership.isDefaultForCollection).toBe(true);
	});

	test("rolls back artwork creation if its product write fails", async () => {
		const now = Math.floor(Date.now() / 1000);
		await client.execute({ sql: "INSERT INTO products (type, name, slug, price, quantity, listed_at, created_at, updated_at) VALUES ('artwork', 'Collision', 'rollback', 1, 0, ?, ?, ?)", args: [now, now, now] });
		await expect(createArtworkAdmin(env, artworkInput({ slug: "rollback", available: true, priceCents: 5000 }), db)).rejects.toThrow();
		const rows = await db.select().from(artworks).where(eq(artworks.slug, "rollback"));
		expect(rows).toHaveLength(0);
	});

	test("published admin content feeds gallery, homepage, filters, post relationships, and sitemap data", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput({ images: [{ url: "https://r2.eonmun.com/artwork-media/study.png", caption: null, isDefault: true }] }), db);
		const collection = await createCollectionAdmin(env, parseCollectionInput({ name: "Live group", slug: "live-group", artworkIds: [artwork.id], defaultArtworkId: artwork.id }), db);
		await updateArtworkAdmin(env, artwork.slug, artworkInput({ published: true, collectionIds: [collection.id], images: [{ url: "https://r2.eonmun.com/artwork-media/study.png", caption: null, isDefault: true }] }), db);
		await updateCollectionAdmin(env, collection.slug, parseCollectionInput({ name: "Live group", slug: "live-group", published: true, artworkIds: [artwork.id], defaultArtworkId: artwork.id }), db);
		await db.insert(homepageArtworks).values({ artworkId: artwork.id, position: 0 });

		const gallery = await getAllArtworks(env, db);
		expect(gallery.map((row) => row.slug)).toEqual(["study"]);
		expect(gallery[0].collections.map((row) => row.slug)).toEqual(["live-group"]);
		expect((await getHomepageSlides(env, db)).map((row) => row.slug)).toEqual(["study"]);
		const relatedArtworks = selectRelatedBySlug(["study"], gallery, (row) => row.slug);
		expect(relatedArtworks).toHaveLength(1);
		const relatedCollections = selectRelatedBySlug(
			["live-group"],
			gallery.flatMap((row) => row.collections),
			(row) => row.slug,
		);
		expect(relatedCollections).toHaveLength(1);
		const sitemapData = createArtworkSitemapEntries(
			new URL("https://eonmun.test"),
			gallery,
			(row) => row.slug,
			(row) => row.publishedAt?.toISOString(),
		);
		expect(sitemapData.map((entry) => entry.loc)).toContain("https://eonmun.test/artworks/study");
	});

	test("one valid Stripe event marks an artwork sold exactly once", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput({ available: true, priceCents: 125000 }), db);
		await updateArtworkAdmin(env, artwork.slug, artworkInput({ published: true, available: true, priceCents: 125000 }), db);
		const [product] = await db.select().from(products).where(eq(products.artworkId, artwork.id));
		expect(await markArtworkPaid(env, "evt_paid", product.id, artwork.slug, db)).toBe(true);
		expect(await markArtworkPaid(env, "evt_paid", product.id, artwork.slug, db)).toBe(false);
		const [sold] = await db.select().from(products).where(eq(products.id, product.id));
		expect(sold.quantity).toBe(0);
		expect(sold.soldAt).toBeInstanceOf(Date);
	});

	test("marks a renamed artwork sold by stable product ID", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput({ available: true, priceCents: 125000 }), db);
		const checkoutSlug = artwork.slug;
		const [product] = await db.select().from(products).where(eq(products.artworkId, artwork.id));

		await updateArtworkAdmin(env, checkoutSlug, artworkInput({
			title: "Renamed study",
			slug: "renamed-study",
			published: true,
			available: true,
			priceCents: 125000,
		}), db);

		expect(await markArtworkPaid(env, "evt_renamed", product.id, checkoutSlug, db)).toBe(true);
		expect(await markArtworkPaid(env, "evt_renamed", product.id, checkoutSlug, db)).toBe(false);
		const [sold] = await db.select().from(products).where(eq(products.id, product.id));
		expect(sold.quantity).toBe(0);
		expect(sold.soldAt).toBeInstanceOf(Date);
	});
});
