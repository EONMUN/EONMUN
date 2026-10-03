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
import { artworks, artworksToCollections, artworksToFacets, collections, facets, homepageArtworks, products } from "../src/db";
import { parseArtworkInput, parseCollectionInput } from "../src/lib/admin-input";
import { artworkContentChanged, collectionContentChanged } from "../src/lib/cache";
import { selectRelatedBySlug } from "../src/lib/public-catalog";

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

    test("measurement edits use numeric storage and recalculate categories", async () => {
        const created = await createArtworkAdmin(env, artworkInput({width:12,height:16,dimensionUnit:'in'}), db);
        await updateArtworkAdmin(env,created.slug,artworkInput({published:true,width:48,height:16,dimensionUnit:'in',materials:['Watercolor']}),db);
        const result = (await getArtworkBySlug(env,created.slug,db))!;
        expect([result.width,result.height,result.depth,result.dimensionUnit]).toEqual([48,16,null,'in']);
        expect(result.facets.some(f=>f.key==='size')).toBe(false);
        expect(result.facets.find(f=>f.key==='orientation')?.value).toBe('Landscape');
        expect(result.facets.some(f=>['width','height','depth','dimension-unit'].includes(f.key))).toBe(false);
        await updateArtworkAdmin(env,created.slug,artworkInput({width:null,height:null,materials:[]}),db);
        const cleared = (await getAdminArtwork(env,created.slug,db))!;
        expect(cleared.width).toBeNull();
        expect(cleared.attributes).toEqual([]);
    });

	test("saves tags as facets alongside image alt text", async () => {
		const image = { url: "https://r2.eonmun.com/artwork-media/study.png", caption: null, altText: "A blue bird on a branch", isDefault: true };
		const input = { images: [image], tags: ["bird", "watercolor"] };
		const created = await createArtworkAdmin(env, artworkInput(input), db);
		await updateArtworkAdmin(env, created.slug, artworkInput({ ...input, published: true }), db);
		const publicArtwork = await getArtworkBySlug(env, created.slug, db);
		expect(publicArtwork?.facets.map(({ namespace, key, value }) => `${namespace}/${key}:${value}`).sort()).toEqual(["artwork/tag:bird", "artwork/tag:watercolor"]);
		expect((await getAllArtworks(env, db)).find(artwork=>artwork.id===created.id)?.facets).toEqual(publicArtwork?.facets);
        expect(publicArtwork?.defaultImageAltText).toBe("A blue bird on a branch");
		expect(publicArtwork?.images[0]?.altText).toBe("A blue bird on a branch");
	});

	test("shares tag facets across artworks and removes cleared tags", async () => {
		const first = await createArtworkAdmin(env, artworkInput({ tags: ["bird"] }), db);
		const second = await createArtworkAdmin(env, artworkInput({ slug: "another-study", tags: ["bird"] }), db);
		expect((await db.select().from(facets).where(eq(facets.key, "tag")))).toHaveLength(1);
		await updateArtworkAdmin(env, first.slug, artworkInput({ tags: [] }), db);
		expect((await db.select().from(artworksToFacets).where(eq(artworksToFacets.artworkId, first.id)))).toHaveLength(0);
		expect((await getArtworkBySlug(env, second.slug, db))).toBeNull();
		await updateArtworkAdmin(env, second.slug, artworkInput({ slug: second.slug, tags: ["bird"], published: true }), db);
		expect((await getArtworkBySlug(env, second.slug, db))?.facets.map((facet) => facet.value)).toEqual(["bird"]);
	});

    test("materials share values and preserve attributes this editor does not own", async () => {
        const first = await createArtworkAdmin(env,artworkInput({materials:['Watercolor'],subjects:['Bird']}),db);
        const second = await createArtworkAdmin(env,artworkInput({slug:'second',materials:['watercolor']}),db);
        const [other] = await db.insert(facets).values({namespace:'shipping',key:'size',value:'Oversize'}).returning();
        await db.insert(artworksToFacets).values({artworkId:first.id,facetId:other.id});
        await updateArtworkAdmin(env,first.slug,artworkInput({materials:[],subjects:['Bird'],published:true}),db);
        expect((await getArtworkBySlug(env,first.slug,db))!.facets.map(f=>`${f.namespace}/${f.key}`)).toEqual(['artwork/subject','shipping/size']);
        expect((await getAdminArtwork(env,second.slug,db))!.attributes.find(f=>f.key==='material')?.value).toBe('Watercolor');
        expect(await db.select().from(facets).where(eq(facets.key,'material'))).toHaveLength(1);
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
		expect(publishedImages.map((image) => image.url)).toEqual(images.map((image) => image.url));
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
