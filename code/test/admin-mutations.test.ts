import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import * as schema from "../src/db/schema";
import { createCatalogSchema } from "./schema-fixture";
import {
	createArtworkAdmin,
	createCollectionAdmin,
	getAdminArtwork,
	getAdminCollection,
	updateArtworkAdmin,
	updateCollectionAdmin,
} from "../src/db/admin";
import { getAllArtworks, getArtworkBySlug, getHomepageSlides, getPublishedArtworkImages } from "../src/db/queries";
import { markArtworkPaid } from "../src/db/checkout";
import { artworks, artworksToCollections, collections, homepageArtworks, products } from "../src/db";
import { parseArtworkInput, parseCollectionInput } from "../src/lib/admin-input";
import { artworkContentChanged, collectionContentChanged } from "../src/lib/cache";
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
	await createCatalogSchema(client);
});

afterEach(async () => {
	client.close();
	await unlink(databasePath).catch(() => undefined);
});

describe("admin mutations", () => {
	test("billing-only edits and draft saves do not refresh public pages", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput(), db);
		let before = await getAdminArtwork(env, artwork.slug, db);
		expect(artworkContentChanged(before, artworkInput({ title: "Draft edit" }))).toBe(false);
		await updateArtworkAdmin(env, artwork.slug, artworkInput({ published: true }), db);
		before = await getAdminArtwork(env, artwork.slug, db);
		expect(artworkContentChanged(before, artworkInput({ published: true, available: true, priceCents: 12000 }))).toBe(false);
		expect(artworkContentChanged(before, artworkInput({ published: true, title: "Visible edit" }))).toBe(true);

		const collection = await createCollectionAdmin(env, parseCollectionInput({
			name: "Group", slug: "group", published: false, artworkIds: [], defaultArtworkId: null,
		}), db);
		let oldCollection = await getAdminCollection(env, collection.slug, db);
		expect(collectionContentChanged(oldCollection, parseCollectionInput({
			name: "Draft edit", slug: "group", published: false, artworkIds: [], defaultArtworkId: null,
		}))).toBe(false);
		await updateCollectionAdmin(env, collection.slug, parseCollectionInput({
			name: "Group", slug: "group", published: true, artworkIds: [], defaultArtworkId: null,
		}), db);
		oldCollection = await getAdminCollection(env, collection.slug, db);
		expect(collectionContentChanged(oldCollection, parseCollectionInput({
			name: "Visible edit", slug: "group", published: true, artworkIds: [], defaultArtworkId: null,
		}))).toBe(true);
	});
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

	test("publishes the checkout price and current stock on the artwork detail", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput({ available: true, priceCents: 125000 }), db);
		let [product] = await db.select().from(products).where(eq(products.artworkId, artwork.id));
		expect(product.quantity).toBe(1);
		expect(product.price).toBe(125000);
		expect(await getArtworkBySlug(env, artwork.slug, db)).toBeNull();

		await updateArtworkAdmin(env, artwork.slug, artworkInput({ published: true, available: true, priceCents: 125000 }), db);
		expect((await getArtworkBySlug(env, artwork.slug, db))?.offer).toEqual({ priceCents: 125000, available: true, sold: false });

		await updateArtworkAdmin(env, artwork.slug, artworkInput({ published: true, available: false, priceCents: "" }), db);
		[product] = await db.select().from(products).where(eq(products.artworkId, artwork.id));
		expect(product.quantity).toBe(0);
		expect(product.price).toBe(125000);
		expect((await getArtworkBySlug(env, artwork.slug, db))?.offer).toEqual({ priceCents: 125000, available: false, sold: false });
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

	test("dates a collection when its published artwork card changes", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput(), db);
		const collection = await createCollectionAdmin(env, parseCollectionInput({
			name: "Group", slug: "group", published: true, artworkIds: [artwork.id], defaultArtworkId: artwork.id,
		}), db);
		await updateCollectionAdmin(env, collection.slug, parseCollectionInput({
			name: "Group", slug: "group", published: true, artworkIds: [artwork.id], defaultArtworkId: artwork.id,
		}), db);
		const oldDate = new Date("2025-01-01T00:00:00.000Z");
		await db.update(collections).set({ updatedAt: oldDate }).where(eq(collections.id, collection.id));
		await updateArtworkAdmin(env, artwork.slug, artworkInput({
			published: true, collectionIds: [collection.id],
		}), db);
		const [changed] = await db.select().from(collections).where(eq(collections.id, collection.id));
		expect(changed.updatedAt.getTime()).toBeGreaterThan(oldDate.getTime());
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

	test("files an artwork into a collection created empty from a name only", async () => {
		const artwork = await createArtworkAdmin(env, artworkInput(), db);
		// What the artwork editor's inline creator sends: a name, no slug, and no
		// membership. The artwork's own save is the single writer of membership.
		const collection = await createCollectionAdmin(env, parseCollectionInput({ name: "Winter Studies" }, { deriveSlug: true }), db);
		expect(collection.slug).toBe("winter-studies");
		expect(await db.select().from(artworksToCollections).where(eq(artworksToCollections.collectionId, collection.id))).toHaveLength(0);

		await updateArtworkAdmin(env, artwork.slug, artworkInput({ collectionIds: [collection.id] }), db);

		const memberships = await db.select().from(artworksToCollections).where(eq(artworksToCollections.collectionId, collection.id));
		expect(memberships.map((row) => row.artworkId)).toEqual([artwork.id]);
	});

	test("rejects a second collection whose derived slug already exists", async () => {
		await createCollectionAdmin(env, parseCollectionInput({ name: "Winter Studies" }, { deriveSlug: true }), db);
		await expect(createCollectionAdmin(env, parseCollectionInput({ name: "winter studies" }, { deriveSlug: true }), db)).rejects.toThrow();
	});

	test("rolls back artwork creation if its product write fails", async () => {
		const now = Math.floor(Date.now() / 1000);
		await client.execute({ sql: "INSERT INTO products (type, name, slug, price, quantity, listed_at, created_at, updated_at) VALUES ('artwork', 'Collision', 'rollback', 1, 0, ?, ?, ?)", args: [now, now, now] });
		await expect(createArtworkAdmin(env, artworkInput({ slug: "rollback", available: true, priceCents: 5000 }), db)).rejects.toThrow();
		const rows = await db.select().from(artworks).where(eq(artworks.slug, "rollback"));
		expect(rows).toHaveLength(0);
	});

	test("published admin content feeds gallery, homepage, filters, post relationships, and sitemap data", async () => {
		const images = [
			{ url: "https://r2.eonmun.com/artwork-media/study.png", caption: null, isDefault: true },
			{ url: "https://r2.eonmun.com/artwork-media/study-detail.png", caption: null, isDefault: false },
		];
		const artwork = await createArtworkAdmin(env, artworkInput({ images }), db);
		await createArtworkAdmin(env, artworkInput({ slug: "draft", images: [{ url: "https://r2.eonmun.com/draft.png", caption: null, isDefault: true }] }), db);
		const collection = await createCollectionAdmin(env, parseCollectionInput({ name: "Live group", slug: "live-group", artworkIds: [artwork.id], defaultArtworkId: artwork.id }), db);
		await updateArtworkAdmin(env, artwork.slug, artworkInput({ published: true, collectionIds: [collection.id], images }), db);
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
		const publishedImages = await getPublishedArtworkImages(env, db);
		expect(publishedImages).toHaveLength(2);
		const sitemapData = createArtworkSitemapEntries(
			new URL("https://eonmun.test"),
			gallery,
			(row) => row.slug,
			(row) => publishedImages.filter((image) => image.slug === row.slug).map((image) => image.url),
			(row) => row.updatedAt.toISOString(),
		);
		expect(sitemapData.map((entry) => entry.loc)).toContain("https://eonmun.test/artworks/study");
		expect(sitemapData[0].images).toEqual(images.map((image) => image.url));
		expect(sitemapData[0].lastmod).toBe(gallery[0].updatedAt.toISOString());
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
