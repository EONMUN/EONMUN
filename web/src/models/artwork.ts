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
 * ```
 */

import { eq, inArray, and, isNotNull, isNull } from 'drizzle-orm';
import { db, artworks, collections } from '@/lib/db';
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
}

/**
 * Artwork with collection relation
 */
export interface ArtworkWithCollections extends SelectArtwork {
  collection: SelectCollection | null;
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

  if (filters.collectionId && filters.collectionId.length > 0) {
    conditions.push(inArray(artworks.collectionId, filters.collectionId));
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
  const conditions = [];

  // Build WHERE conditions from filters
  if (filters.id && filters.id.length > 0) {
    conditions.push(inArray(artworks.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    conditions.push(inArray(artworks.slug, filters.slug));
  }

  if (filters.collectionId && filters.collectionId.length > 0) {
    conditions.push(inArray(artworks.collectionId, filters.collectionId));
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

  // Execute query with left join to collections
  const query = db
    .select()
    .from(artworks)
    .leftJoin(collections, eq(artworks.collectionId, collections.id));

  let results;
  if (conditions.length > 0) {
    results = await query.where(and(...conditions));
  } else {
    results = await query;
  }

  // Transform results to include collection as a property
  return results.map((row) => ({
    ...row.artworks,
    collection: row.collections,
  }));
}
