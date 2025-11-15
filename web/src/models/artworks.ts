import { eq, sql, or, like } from 'drizzle-orm';
import { db, artworks } from '@/lib/db';

export type Artwork = typeof artworks.$inferSelect;
export type NewArtwork = typeof artworks.$inferInsert;

/**
 * Get all artworks
 */
export async function getAllArtworks(): Promise<Artwork[]> {
  return db.select().from(artworks);
}

/**
 * Get an artwork by ID
 */
export async function getArtworkById(id: number): Promise<Artwork | undefined> {
  const results = await db.select().from(artworks).where(eq(artworks.id, id));
  return results[0];
}

/**
 * Get an artwork by slug
 */
export async function getArtworkBySlug(slug: string): Promise<Artwork | undefined> {
  const results = await db.select().from(artworks).where(eq(artworks.slug, slug));
  return results[0];
}

/**
 * Search artworks by title or artist
 */
export async function searchArtworks(query: string): Promise<Artwork[]> {
  if (!query || query.trim() === '') {
    return getAllArtworks();
  }

  const searchPattern = `%${query}%`;
  return db
    .select()
    .from(artworks)
    .where(
      or(
        like(artworks.title, searchPattern),
        like(artworks.artist, searchPattern)
      )
    );
}

/**
 * Get an artwork with its collection
 * TODO: Update for many-to-many relationship using artworks_to_collections
 */
// export async function getArtworkWithCollection(id: number) {
//   return db.query.artworks.findFirst({
//     where: eq(artworks.id, id),
//     with: {
//       collection: true,
//     },
//   });
// }

/**
 * Create a new artwork
 */
export async function createArtwork(artwork: NewArtwork): Promise<Artwork> {
  const results = await db.insert(artworks).values(artwork).returning();
  return results[0];
}

/**
 * Update an artwork
 */
export async function updateArtwork(
  id: number,
  updates: Partial<NewArtwork>
): Promise<Artwork | undefined> {
  const results = await db
    .update(artworks)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(artworks.id, id))
    .returning();
  return results[0];
}

/**
 * Delete an artwork
 */
export async function deleteArtwork(id: number): Promise<void> {
  await db.delete(artworks).where(eq(artworks.id, id));
}
