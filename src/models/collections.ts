import { eq, sql } from 'drizzle-orm';
import { db, collections, artworks, artworksToCollections } from '@/database';

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Artwork = typeof artworks.$inferSelect;

export type CollectionWithDefaultArtwork = Collection & {
  defaultArtworkImageUrl: string | null;
  artworkCount: number;
};

export type ArtworkWithDefault = Artwork & {
  isDefaultForCollection: boolean;
};

export type CollectionWithArtworks = Collection & {
  artworks: ArtworkWithDefault[];
  defaultArtwork: Artwork | null;
};

/**
 * Get all collections
 */
export async function getAllCollections(): Promise<Collection[]> {
  return db.select().from(collections);
}

/**
 * Get all collections with their default artwork image URL
 */
export async function getAllCollectionsWithDefaultArtwork(): Promise<CollectionWithDefaultArtwork[]> {
  const allCollections = await db.select().from(collections);

  // Get default artworks for each collection
  const collectionIds = allCollections.map(c => c.id);
  if (collectionIds.length === 0) {
    return [];
  }

  const defaultArtworks = await db
    .select({
      collectionId: artworksToCollections.collectionId,
      defaultImageUrl: artworks.defaultImageUrl,
    })
    .from(artworksToCollections)
    .innerJoin(artworks, eq(artworksToCollections.artworkId, artworks.id))
    .where(sql`${artworksToCollections.isDefaultForCollection} = 1`);

  // Get artwork counts for each collection
  const artworkCounts = await db
    .select({
      collectionId: artworksToCollections.collectionId,
      count: sql<number>`count(*)`.as('count'),
    })
    .from(artworksToCollections)
    .groupBy(artworksToCollections.collectionId);

  // Map default artwork images to collections
  const defaultImageMap = new Map(
    defaultArtworks.map(da => [da.collectionId, da.defaultImageUrl])
  );

  // Map artwork counts to collections
  const artworkCountMap = new Map(
    artworkCounts.map(ac => [ac.collectionId, ac.count])
  );

  return allCollections.map(collection => ({
    ...collection,
    defaultArtworkImageUrl: defaultImageMap.get(collection.id) || null,
    artworkCount: artworkCountMap.get(collection.id) || 0,
  }));
}

/**
 * Get a collection by ID
 */
export async function getCollectionById(id: number): Promise<Collection | undefined> {
  const results = await db.select().from(collections).where(eq(collections.id, id));
  return results[0];
}

/**
 * Get a collection by slug
 */
export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const results = await db.select().from(collections).where(eq(collections.slug, slug));
  return results[0];
}

/**
 * Get a collection by slug with all its artworks
 */
export async function getCollectionWithArtworksBySlug(slug: string): Promise<CollectionWithArtworks | null> {
  // Get the collection
  const [collection] = await db.select().from(collections).where(eq(collections.slug, slug));
  if (!collection) {
    return null;
  }

  // Get all artworks for this collection with their default status
  const artworkData = await db
    .select({
      artwork: artworks,
      isDefault: artworksToCollections.isDefaultForCollection,
    })
    .from(artworksToCollections)
    .innerJoin(artworks, eq(artworksToCollections.artworkId, artworks.id))
    .where(eq(artworksToCollections.collectionId, collection.id));

  const artworksWithDefault: ArtworkWithDefault[] = artworkData.map((row) => ({
    ...row.artwork,
    isDefaultForCollection: row.isDefault,
  }));

  const defaultArtwork = artworksWithDefault.find(a => a.isDefaultForCollection) || null;

  return {
    ...collection,
    artworks: artworksWithDefault,
    defaultArtwork,
  };
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

/**
 * Add an artwork to a collection
 */
export async function addArtworkToCollection(
  collectionId: number,
  artworkId: number,
  isDefault: boolean = false
): Promise<void> {
  // If setting as default, first unset any existing default
  if (isDefault) {
    await db
      .update(artworksToCollections)
      .set({ isDefaultForCollection: false })
      .where(eq(artworksToCollections.collectionId, collectionId));
  }

  await db.insert(artworksToCollections).values({
    artworkId,
    collectionId,
    isDefaultForCollection: isDefault,
  });
}

/**
 * Remove an artwork from a collection
 */
export async function removeArtworkFromCollection(
  collectionId: number,
  artworkId: number
): Promise<void> {
  await db
    .delete(artworksToCollections)
    .where(
      sql`${artworksToCollections.collectionId} = ${collectionId} AND ${artworksToCollections.artworkId} = ${artworkId}`
    );
}

/**
 * Set an artwork as the default for a collection
 */
export async function setDefaultArtwork(
  collectionId: number,
  artworkId: number
): Promise<void> {
  // First, unset any existing default
  await db
    .update(artworksToCollections)
    .set({ isDefaultForCollection: false })
    .where(eq(artworksToCollections.collectionId, collectionId));

  // Then set the new default
  await db
    .update(artworksToCollections)
    .set({ isDefaultForCollection: true })
    .where(
      sql`${artworksToCollections.collectionId} = ${collectionId} AND ${artworksToCollections.artworkId} = ${artworkId}`
    );
}
