import { eq } from 'drizzle-orm';
import { db, collections, artworks } from '@/lib/db';

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Artwork = typeof artworks.$inferSelect;

/**
 * Get all collections
 */
export async function getAllCollections(): Promise<Collection[]> {
  return db.select().from(collections);
}

/**
 * Get a collection by ID
 */
export async function getCollectionById(id: number): Promise<Collection | undefined> {
  const results = await db.select().from(collections).where(eq(collections.id, id));
  return results[0];
}

/**
 * Get a collection with its artworks
 */
export async function getCollectionWithArtworks(id: number) {
  return db.query.collections.findFirst({
    where: eq(collections.id, id),
    with: {
      artworks: true,
    },
  });
}

/**
 * Get all artworks for a collection
 */
export async function getArtworksByCollectionId(collectionId: number): Promise<Artwork[]> {
  return db.select().from(artworks).where(eq(artworks.collectionId, collectionId));
}

/**
 * Create a new collection
 */
export async function createCollection(collection: NewCollection): Promise<Collection> {
  const results = await db.insert(collections).values(collection).returning();
  return results[0];
}

/**
 * Update a collection
 */
export async function updateCollection(
  id: number,
  updates: Partial<NewCollection>
): Promise<Collection | undefined> {
  const results = await db
    .update(collections)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(collections.id, id))
    .returning();
  return results[0];
}

/**
 * Delete a collection
 */
export async function deleteCollection(id: number): Promise<void> {
  await db.delete(collections).where(eq(collections.id, id));
}
