import { expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { unlink } from "node:fs/promises";
import * as schema from "../src/db/schema";
import { getAvailableArtworkCatalog } from "../src/db/catalog";
import { createCatalogSchema } from "./schema-fixture";

test("catalog follows publication, price, and live stock", async () => {
	const path = `/tmp/eonmun-pinterest-test-${crypto.randomUUID()}.db`;
	const client = createClient({ url: `file:${path}` });
	try {
		await createCatalogSchema(client);
		const db = drizzle(client, { schema });
		const stamp = 1_700_000_000;
		for (const [state, publishedAt, quantity, soldAt, price] of [
			["live", stamp, 1, null, 12345],
			["draft", null, 1, null, 12345],
			["unavailable", stamp, 0, null, 12345],
			["sold", stamp, 1, stamp, 12345],
			["unpriced", stamp, 1, null, 0],
			["imageless", stamp, 1, null, 12345],
		] as const) {
			const artwork = await client.execute({ sql: "INSERT INTO artworks (title, slug, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?) RETURNING id", args: [state, state, publishedAt, stamp, stamp] });
			const id = Number(artwork.rows[0].id);
			if (state !== "imageless") await client.execute({ sql: "INSERT INTO artwork_images (artwork_id, url, is_default, created_at, updated_at) VALUES (?, ?, 1, ?, ?)", args: [id, `https://r2.eonmun.com/${state}.jpg`, stamp, stamp] });
			await client.execute({ sql: "INSERT INTO products (type, artwork_id, name, slug, price, quantity, sold_at, listed_at, created_at, updated_at) VALUES ('artwork', ?, ?, ?, ?, ?, ?, ?, ?, ?)", args: [id, state, state, price, quantity, soldAt, stamp, stamp, stamp] });
		}
		const catalog = await getAvailableArtworkCatalog({}, db);
		expect(catalog.map((item) => [item.slug, item.priceCents])).toEqual([["live", 12345]]);
	} finally {
		client.close();
		await unlink(path).catch(() => undefined);
	}
});
