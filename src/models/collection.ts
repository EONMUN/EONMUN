/**
 * Collection model functions for querying collections from the database.
 *
 * All functions return arrays of results, never single items.
 * This reduces the number of functions we need to maintain.
 *
 * @example
 * ```typescript
 * // Get all collections
 * const allCollections = await findCollections({});
 *
 * // Get collection by slug
 * const [collection] = await findCollections({ slug: ['my-collection'] });
 *
 * // Get collections by multiple slugs
 * const collections = await findCollections({ slug: ['slug-1', 'slug-2'] });
 *
 * // Get published collections
 * const collections = await findCollections({ published: true });
 *
 * // Get collections with their artworks
 * const collectionsWithArtworks = await findCollectionsWithArtworks({
 *   slug: ['my-collection']
 * });
 * ```
 */

import { eq, inArray, and, isNotNull, isNull } from 'drizzle-orm';
import { db, collections, artworks, artworksToCollections } from '@/database';
import type { SelectCollection } from '@/database/factories/collection.factory';
import type { SelectArtwork } from '@/database/factories/artwork.factory';

/**
 * Filters for querying collections
 */
export interface CollectionFilters {
  /** Filter by collection IDs */
  id?: number[];
  /** Filter by collection slugs */
  slug?: string[];
  /** Filter by publication status (true = published, false = drafts) */
  published?: boolean;
  /** Filter by locale */
  locale?: string[];
}

/**
 * Collection with artworks relation
 */
export interface CollectionWithArtworks extends SelectCollection {
  artworks: SelectArtwork[];
}

/**
 * Find collections based on filters.
 * Always returns an array, even for single results.
 *
 * @param filters - Optional filters to apply
 * @returns Array of collections matching the filters
 */
export async function findCollections(filters: CollectionFilters = {}): Promise<SelectCollection[]> {
  const conditions = [];

  // Build WHERE conditions from filters
  if (filters.id && filters.id.length > 0) {
    conditions.push(inArray(collections.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    conditions.push(inArray(collections.slug, filters.slug));
  }

  if (filters.published === true) {
    conditions.push(isNotNull(collections.publishedAt));
  } else if (filters.published === false) {
    conditions.push(isNull(collections.publishedAt));
  }

  if (filters.locale && filters.locale.length > 0) {
    conditions.push(inArray(collections.locale, filters.locale));
  }

  // Execute query with conditions
  const query = db
    .select()
    .from(collections);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }

  return await query;
}

/**
 * Find collections with their artwork relations.
 * Always returns an array, even for single results.
 *
 * @param filters - Optional filters to apply
 * @returns Array of collections with artwork data
 */
export async function findCollectionsWithArtworks(
  filters: CollectionFilters = {}
): Promise<CollectionWithArtworks[]> {
  const conditions = [];

  // Build WHERE conditions from filters
  if (filters.id && filters.id.length > 0) {
    conditions.push(inArray(collections.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    conditions.push(inArray(collections.slug, filters.slug));
  }

  if (filters.published === true) {
    conditions.push(isNotNull(collections.publishedAt));
  } else if (filters.published === false) {
    conditions.push(isNull(collections.publishedAt));
  }

  if (filters.locale && filters.locale.length > 0) {
    conditions.push(inArray(collections.locale, filters.locale));
  }

  // Execute query to get collections
  const query = db
    .select()
    .from(collections);

  let matchedCollections;
  if (conditions.length > 0) {
    matchedCollections = await query.where(and(...conditions));
  } else {
    matchedCollections = await query;
  }

  // If no collections found, return empty array
  if (matchedCollections.length === 0) {
    return [];
  }

  // Get all artworks for the matched collections via junction table
  const collectionIds = matchedCollections.map((c) => c.id);
  const junctionData = await db
    .select({
      collectionId: artworksToCollections.collectionId,
      artwork: artworks,
    })
    .from(artworksToCollections)
    .innerJoin(artworks, eq(artworksToCollections.artworkId, artworks.id))
    .where(inArray(artworksToCollections.collectionId, collectionIds));

  // Group artworks by collection ID
  const artworksByCollectionId = new Map<number, SelectArtwork[]>();
  for (const row of junctionData) {
    const existing = artworksByCollectionId.get(row.collectionId) || [];
    existing.push(row.artwork);
    artworksByCollectionId.set(row.collectionId, existing);
  }

  // Combine collections with their artworks
  return matchedCollections.map((collection) => ({
    ...collection,
    artworks: artworksByCollectionId.get(collection.id) || [],
  }));
}
