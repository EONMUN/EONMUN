import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { unlink } from "node:fs/promises";
import * as schema from "../src/db/schema";
import { createCatalogSchema } from "./schema-fixture";
import { getAdminArtworkCards, getAdminCollectionCards, getAdminDashboard } from "../src/db/admin";

const env = { TURSO_DATABASE_URL: "https://unused.test" };
let client: Client;
let db: ReturnType<typeof drizzle<typeof schema>>;
let databasePath: string;

// created_at holds whole seconds, so fixtures share one stamp on purpose: it is
// the tie the id ordering has to break.
const STAMP = 1_700_000_000;

async function insertArtwork(title: string, slug: string, published: boolean) {
	const result = await client.execute({
		sql: "INSERT INTO artworks (title, slug, year, published_at, created_at, updated_at) VALUES (?, ?, 2026, ?, ?, ?) RETURNING id",
		args: [title, slug, published ? STAMP : null, STAMP, STAMP],
	});
	return Number(result.rows[0].id);
}

async function insertImage(artworkId: number, url: string, isDefault: boolean) {
	await client.execute({
		sql: "INSERT INTO artwork_images (artwork_id, url, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		args: [artworkId, url, isDefault ? 1 : 0, STAMP, STAMP],
	});
}

beforeEach(async () => {
	databasePath = `/tmp/eonmun-dashboard-test-${crypto.randomUUID()}.db`;
	client = createClient({ url: `file:${databasePath}` });
	db = drizzle(client, { schema });
	await createCatalogSchema(client);
});

afterEach(async () => {
	client.close();
	await unlink(databasePath).catch(() => undefined);
});

describe("admin dashboard", () => {
	test("reports zeroed tallies and empty lists for a new catalog", async () => {
		const dashboard = await getAdminDashboard(env, db);
		expect(dashboard.artworks).toEqual({ recent: [], tally: { total: 0, published: 0 } });
		expect(dashboard.collections).toEqual({ recent: [], tally: { total: 0, published: 0 } });
		expect(dashboard.store).toEqual({ recent: [], tally: { total: 0, available: 0, sold: 0 } });
	});

	test("keeps the newest three in insertion order when created_at ties", async () => {
		for (const [index, slug] of ["one", "two", "three", "four"].entries()) {
			await insertArtwork(`Work ${index + 1}`, slug, index < 2);
		}
		const dashboard = await getAdminDashboard(env, db);
		expect(dashboard.artworks.recent.map((artwork) => artwork.slug)).toEqual(["four", "three", "two"]);
		expect(dashboard.artworks.tally).toEqual({ total: 4, published: 2 });
	});

	test("shows the flagged default image rather than the first one stored", async () => {
		const id = await insertArtwork("Camélia", "camelia", true);
		await insertImage(id, "https://r2.eonmun.com/second.jpeg", false);
		await insertImage(id, "https://r2.eonmun.com/cover.jpeg", true);
		const [card] = await getAdminDashboard(env, db).then((dashboard) => dashboard.artworks.recent);
		expect(card.imageUrl).toBe("https://r2.eonmun.com/cover.jpeg");
	});

	// The partial unique index caps defaults at one but never requires one, so
	// this state is representable by direct SQL. admin-input.ts:67 promotes the
	// first image on every application write, which is what keeps it unreachable
	// in production — if that promotion is ever removed, these covers go blank.
	test("shows no cover for an artwork whose images carry no default flag", async () => {
		const id = await insertArtwork("Unflagged", "unflagged", true);
		await insertImage(id, "https://r2.eonmun.com/first.jpeg", false);
		await insertImage(id, "https://r2.eonmun.com/second.jpeg", false);

		const [card] = await getAdminArtworkCards(env, db);
		expect(card.imageUrl).toBeNull();
	});

	test("returns empty lists to the list pages for a new catalog", async () => {
		expect(await getAdminArtworkCards(env, db)).toEqual([]);
		expect(await getAdminCollectionCards(env, db)).toEqual([]);
	});

	test("counts every member and leads the cover fan with the collection's cover piece", async () => {
		const plain = await insertArtwork("Plain", "plain", true);
		const cover = await insertArtwork("Cover", "cover", true);
		const bare = await insertArtwork("Bare", "bare", true);
		await insertImage(plain, "https://r2.eonmun.com/plain.jpeg", true);
		await insertImage(cover, "https://r2.eonmun.com/cover.jpeg", true);
		await client.execute({
			sql: "INSERT INTO collections (name, slug, published_at, created_at, updated_at) VALUES ('Botánica', 'botanica', ?, ?, ?)",
			args: [STAMP, STAMP, STAMP],
		});
		for (const [artworkId, isCover] of [[plain, 0], [cover, 1], [bare, 0]] as const) {
			await client.execute({
				sql: "INSERT INTO artworks_to_collections (artwork_id, collection_id, is_default_for_collection, created_at) VALUES (?, 1, ?, ?)",
				args: [artworkId, isCover, STAMP],
			});
		}

		await client.execute({
			sql: "INSERT INTO collections (name, slug, published_at, created_at, updated_at) VALUES ('Alpha', 'alpha', ?, ?, ?)",
			args: [STAMP, STAMP, STAMP],
		});

		const cards = await getAdminCollectionCards(env, db);
		// The collections page lists alphabetically.
		expect(cards.map((card) => card.slug)).toEqual(["alpha", "botanica"]);

		const collection = cards.find((card) => card.slug === "botanica")!;
		// Three members, but only two carry an image, and the cover piece leads.
		expect(collection.artworkCount).toBe(3);
		expect(collection.coverUrls).toEqual([
			"https://r2.eonmun.com/cover.jpeg",
			"https://r2.eonmun.com/plain.jpeg",
		]);
	});

	test("resolves a product back to the artwork that edits it", async () => {
		const artworkId = await insertArtwork("Sold Work", "sold-work", true);
		await client.execute({
			sql: "INSERT INTO products (type, artwork_id, name, slug, price, quantity, listed_at, created_at, updated_at) VALUES ('artwork', ?, 'Sold Work', 'sold-work', 45678, 1, ?, ?, ?)",
			args: [artworkId, STAMP, STAMP, STAMP],
		});
		await client.execute({
			sql: "INSERT INTO products (type, name, slug, price, quantity, listed_at, sold_at, created_at, updated_at) VALUES ('print', 'Detached', 'detached', 1000, 0, ?, ?, ?, ?)",
			args: [STAMP, STAMP, STAMP, STAMP],
		});

		const { store } = await getAdminDashboard(env, db);
		expect(store.tally).toEqual({ total: 2, available: 1, sold: 1 });
		const bySlug = new Map(store.recent.map((product) => [product.slug, product]));
		expect(bySlug.get("sold-work")?.artworkSlug).toBe("sold-work");
		expect(bySlug.get("detached")?.artworkSlug).toBeNull();
	});

	test("lists every artwork with its cover for the artwork admin page", async () => {
		const zebra = await insertArtwork("Zebra", "zebra", false);
		await insertArtwork("Alpha", "alpha", true);
		await insertImage(zebra, "https://r2.eonmun.com/zebra.jpeg", true);

		const cards = await getAdminArtworkCards(env, db);
		expect(cards.map((card) => card.slug)).toEqual(["alpha", "zebra"]);
		expect(cards[0].imageUrl).toBeNull();
		expect(cards[1].imageUrl).toBe("https://r2.eonmun.com/zebra.jpeg");
		expect(cards[1].publishedAt).toBeNull();
	});
});
