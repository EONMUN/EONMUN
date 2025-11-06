import { eq } from 'drizzle-orm';
import { db } from '@/database';
import { artworks } from '@/database/schema';

export type Artwork = typeof artworks.$inferSelect;
export type NewArtwork = typeof artworks.$inferInsert;

/**
 * Get all artworks
 */
export async function getAllArtworks(): Promise<Artwork[]> {
  return db.select().from(artworks).all();
}

/**
 * Get an artwork by ID
 */
export async function getArtworkById(id: number): Promise<Artwork | undefined> {
  const result = db.select().from(artworks).where(eq(artworks.id, id)).get();
  return result;
}

/**
 * Get an artwork with its collection
 */
export async function getArtworkWithCollection(id: number) {
  return db.query.artworks.findFirst({
    where: eq(artworks.id, id),
    with: {
      collection: true,
    },
  });
}

/**
 * Create a new artwork
 */
export async function createArtwork(artwork: NewArtwork): Promise<Artwork> {
  const result = db.insert(artworks).values(artwork).returning().get();
  return result;
}

/**
 * Update an artwork
 */
export async function updateArtwork(
  id: number,
  updates: Partial<NewArtwork>
): Promise<Artwork | undefined> {
  const result = db
    .update(artworks)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(artworks.id, id))
    .returning()
    .get();
  return result;
}

/**
 * Delete an artwork
 */
export async function deleteArtwork(id: number): Promise<void> {
  db.delete(artworks).where(eq(artworks.id, id)).run();
}
