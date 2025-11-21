/**
 * Artwork model functions for querying artworks from the database.
 *
 * All functions return arrays of results, never single items.
 * This reduces the number of functions we need to maintain.
 *
 * @example
 * ```typescript
 * // Get all artworks
 * const allArtworks = await findArtworks({});
 *
 * // Get artwork by slug
 * const [artwork] = await findArtworks({ slug: ['my-artwork'] });
 *
 * // Get artworks by multiple slugs
 * const artworks = await findArtworks({ slug: ['slug-1', 'slug-2'] });
 *
 * // Get published artworks from 2020
 * const artworks = await findArtworks({
 *   published: true,
 *   year: [2020]
 * });
 *
 * // Get artworks with their collections
 * const artworksWithCollections = await findArtworksWithCollections({
 *   slug: ['my-artwork']
 * });
 *
 * // Get default artworks for all collections
 * const defaultArtworks = await findArtworksWithCollections({
 *   isDefaultForCollection: true
 * });
 * ```
 */

import { eq, inArray, and, isNotNull, isNull } from 'drizzle-orm';
import { db, artworks, collections, artworksToCollections } from '@/lib/db';
import type { SelectArtwork } from '@/database/factories/artwork.factory';
import type { SelectCollection } from '@/database/factories/collection.factory';

/**
 * Filters for querying artworks
 */
export interface ArtworkFilters {
  /** Filter by artwork IDs */
  id?: number[];
  /** Filter by artwork slugs */
  slug?: string[];
  /** Filter by collection IDs */
  collectionId?: number[];
  /** Filter by years */
  year?: number[];
  /** Filter by publication status (true = published, false = drafts) */
  published?: boolean;
  /** Filter by locale */
  locale?: string[];
  /** Filter by default for collection status */
  isDefaultForCollection?: boolean;
}

/**
 * Artwork with collections relation
 */
export interface ArtworkWithCollections extends SelectArtwork {
  collections: SelectCollection[];
}

/**
 * Find artworks based on filters.
 * Always returns an array, even for single results.
 *
 * @param filters - Optional filters to apply
 * @returns Array of artworks matching the filters
 */
export async function findArtworks(filters: ArtworkFilters = {}): Promise<SelectArtwork[]> {
  const conditions = [];

  // Build WHERE conditions from filters
  if (filters.id && filters.id.length > 0) {
    conditions.push(inArray(artworks.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    conditions.push(inArray(artworks.slug, filters.slug));
  }

  if (filters.year && filters.year.length > 0) {
    conditions.push(inArray(artworks.year, filters.year));
  }

  if (filters.published === true) {
    conditions.push(isNotNull(artworks.publishedAt));
  } else if (filters.published === false) {
    conditions.push(isNull(artworks.publishedAt));
  }

  if (filters.locale && filters.locale.length > 0) {
    conditions.push(inArray(artworks.locale, filters.locale));
  }

  // Execute query with conditions
  const query = db
    .select()
    .from(artworks);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }

  return await query;
}

/**
 * Find artworks with their collection relations.
 * Always returns an array, even for single results.
 *
 * @param filters - Optional filters to apply
 * @returns Array of artworks with collection data
 */
export async function findArtworksWithCollections(
  filters: ArtworkFilters = {}
): Promise<ArtworkWithCollections[]> {
  const artworkConditions = [];
  const junctionConditions = [];

  // Build WHERE conditions for artworks table
  if (filters.id && filters.id.length > 0) {
    artworkConditions.push(inArray(artworks.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    artworkConditions.push(inArray(artworks.slug, filters.slug));
  }

  if (filters.year && filters.year.length > 0) {
    artworkConditions.push(inArray(artworks.year, filters.year));
  }

  if (filters.published === true) {
    artworkConditions.push(isNotNull(artworks.publishedAt));
  } else if (filters.published === false) {
    artworkConditions.push(isNull(artworks.publishedAt));
  }

  if (filters.locale && filters.locale.length > 0) {
    artworkConditions.push(inArray(artworks.locale, filters.locale));
  }

  // Build WHERE conditions for junction table
  if (filters.collectionId && filters.collectionId.length > 0) {
    junctionConditions.push(inArray(artworksToCollections.collectionId, filters.collectionId));
  }

  if (filters.isDefaultForCollection === true) {
    junctionConditions.push(eq(artworksToCollections.isDefaultForCollection, true));
  } else if (filters.isDefaultForCollection === false) {
    junctionConditions.push(eq(artworksToCollections.isDefaultForCollection, false));
  }

  // Get artworks first
  let matchedArtworks: SelectArtwork[];
  if (artworkConditions.length > 0) {
    matchedArtworks = await db
      .select()
      .from(artworks)
      .where(and(...artworkConditions));
  } else {
    matchedArtworks = await db.select().from(artworks);
  }

  if (matchedArtworks.length === 0) {
    return [];
  }

  // Get junction table data with collection info
  const artworkIds = matchedArtworks.map((a) => a.id);
  const junctionQuery = db
    .select({
      artworkId: artworksToCollections.artworkId,
      collectionId: artworksToCollections.collectionId,
      isDefault: artworksToCollections.isDefaultForCollection,
      collection: collections,
    })
    .from(artworksToCollections)
    .innerJoin(collections, eq(artworksToCollections.collectionId, collections.id))
    .where(and(
      inArray(artworksToCollections.artworkId, artworkIds),
      ...(junctionConditions.length > 0 ? junctionConditions : [])
    ));

  const junctionData = await junctionQuery;

  // If filtering by collection/isDefault and no junction data found, return empty
  if (junctionConditions.length > 0 && junctionData.length === 0) {
    return [];
  }

  // Group collections by artwork ID
  const collectionsByArtworkId = new Map<number, SelectCollection[]>();
  for (const row of junctionData) {
    const existing = collectionsByArtworkId.get(row.artworkId) || [];
    existing.push(row.collection);
    collectionsByArtworkId.set(row.artworkId, existing);
  }

  // Filter artworks based on junction conditions if any
  const filteredArtworks = junctionConditions.length > 0
    ? matchedArtworks.filter(artwork => collectionsByArtworkId.has(artwork.id))
    : matchedArtworks;

  // Combine artworks with their collections
  return filteredArtworks.map((artwork) => ({
    ...artwork,
    collections: collectionsByArtworkId.get(artwork.id) || [],
  }));
}
