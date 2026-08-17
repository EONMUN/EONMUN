import type { Client } from "@libsql/client";

// One hand-written copy of the catalog schema for the whole suite. Two copies
// drift: a column added to one leaves the other testing a schema the queries no
// longer run against, and the suite still passes.
export async function createCatalogSchema(client: Client) {
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
}
