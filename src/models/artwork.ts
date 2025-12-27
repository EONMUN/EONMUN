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

import { eq, inArray, and, isNotNull, isNull, asc } from "drizzle-orm";
import {
  db,
  artworks,
  collections,
  artworksToCollections,
  products,
} from "@/database";
import type { SelectArtwork } from "@/database/factories/artwork.factory";
import type { SelectCollection } from "@/database/factories/collection.factory";
import type { SelectProduct } from "@/database/factories/product.factory";

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
  /** Filter by home page presence (true = has homePageOrder, false = no homePageOrder) */
  onHomePage?: boolean;
  /** Order by homePageOrder ascending */
  orderByHomePageOrder?: boolean;
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
export async function findArtworks(
  filters: ArtworkFilters = {},
): Promise<SelectArtwork[]> {
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

  if (filters.onHomePage === true) {
    conditions.push(isNotNull(artworks.homePageOrder));
  } else if (filters.onHomePage === false) {
    conditions.push(isNull(artworks.homePageOrder));
  }

  // Execute query with conditions
  const query = db.select().from(artworks);

  if (conditions.length > 0) {
    if (filters.orderByHomePageOrder) {
      return await query
        .where(and(...conditions))
        .orderBy(asc(artworks.homePageOrder));
    }
    return await query.where(and(...conditions));
  }

  if (filters.orderByHomePageOrder) {
    return await query.orderBy(asc(artworks.homePageOrder));
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
  filters: ArtworkFilters = {},
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

  if (filters.onHomePage === true) {
    artworkConditions.push(isNotNull(artworks.homePageOrder));
  } else if (filters.onHomePage === false) {
    artworkConditions.push(isNull(artworks.homePageOrder));
  }

  // Build WHERE conditions for junction table
  if (filters.collectionId && filters.collectionId.length > 0) {
    junctionConditions.push(
      inArray(artworksToCollections.collectionId, filters.collectionId),
    );
  }

  if (filters.isDefaultForCollection === true) {
    junctionConditions.push(
      eq(artworksToCollections.isDefaultForCollection, true),
    );
  } else if (filters.isDefaultForCollection === false) {
    junctionConditions.push(
      eq(artworksToCollections.isDefaultForCollection, false),
    );
  }

  // Get artworks first
  let matchedArtworks: SelectArtwork[];
  if (artworkConditions.length > 0) {
    if (filters.orderByHomePageOrder) {
      matchedArtworks = await db
        .select()
        .from(artworks)
        .where(and(...artworkConditions))
        .orderBy(asc(artworks.homePageOrder));
    } else {
      matchedArtworks = await db
        .select()
        .from(artworks)
        .where(and(...artworkConditions));
    }
  } else {
    if (filters.orderByHomePageOrder) {
      matchedArtworks = await db
        .select()
        .from(artworks)
        .orderBy(asc(artworks.homePageOrder));
    } else {
      matchedArtworks = await db.select().from(artworks);
    }
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
    .innerJoin(
      collections,
      eq(artworksToCollections.collectionId, collections.id),
    )
    .where(
      and(
        inArray(artworksToCollections.artworkId, artworkIds),
        ...(junctionConditions.length > 0 ? junctionConditions : []),
      ),
    );

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
  const filteredArtworks =
    junctionConditions.length > 0
      ? matchedArtworks.filter((artwork) =>
          collectionsByArtworkId.has(artwork.id),
        )
      : matchedArtworks;

  // Combine artworks with their collections
  return filteredArtworks.map((artwork) => ({
    ...artwork,
    collections: collectionsByArtworkId.get(artwork.id) || [],
  }));
}

/**
 * Artwork with its associated product (type='artwork')
 */
export interface ArtworkWithProduct extends SelectArtwork {
  product: SelectProduct | null;
}

/**
 * Find artworks with their associated artwork-type product.
 * This is useful for admin pages that need to display artwork prices.
 *
 * @param filters - Optional filters to apply
 * @returns Array of artworks with product data
 *
 * @example
 * ```typescript
 * // Get all artworks with their products
 * const artworksWithProducts = await findArtworksWithProducts({});
 *
 * // Get a specific artwork with its product
 * const [artworkWithProduct] = await findArtworksWithProducts({ slug: ['my-artwork'] });
 * ```
 */
export async function findArtworksWithProducts(
  filters: ArtworkFilters = {},
): Promise<ArtworkWithProduct[]> {
  // Get artworks first
  const matchedArtworks = await findArtworks(filters);

  if (matchedArtworks.length === 0) {
    return [];
  }

  // Get artwork IDs
  const artworkIds = matchedArtworks.map((a) => a.id);

  // Fetch products for these artworks (type='artwork' only)
  const artworkProducts = await db
    .select()
    .from(products)
    .where(
      and(
        inArray(products.artworkId, artworkIds),
        eq(products.type, "artwork"),
      ),
    );

  // Create a map of artworkId -> product
  const productByArtworkId = new Map<number, SelectProduct>();
  for (const product of artworkProducts) {
    if (product.artworkId !== null) {
      productByArtworkId.set(product.artworkId, product);
    }
  }

  // Combine artworks with their products
  return matchedArtworks.map((artwork) => ({
    ...artwork,
    product: productByArtworkId.get(artwork.id) || null,
  }));
}

/**
 * Find a single artwork with its associated artwork-type product by ID.
 *
 * @param id - The artwork ID
 * @returns The artwork with product data, or null if not found
 */
export async function findArtworkWithProduct(
  id: number,
): Promise<ArtworkWithProduct | null> {
  const [result] = await findArtworksWithProducts({ id: [id] });
  return result || null;
}

/**
 * Find a single artwork with its associated artwork-type product by slug.
 *
 * @param slug - The artwork slug
 * @returns The artwork with product data, or null if not found
 */
export async function findArtworkWithProductBySlug(
  slug: string,
): Promise<ArtworkWithProduct | null> {
  const [result] = await findArtworksWithProducts({ slug: [slug] });
  return result || null;
}

/**
 * Artwork with both product and collections relations.
 * Used for admin pages that need complete artwork data.
 */
export interface ArtworkWithProductAndCollections extends SelectArtwork {
  product: SelectProduct | null;
  collections: SelectCollection[];
}

/**
 * Find artworks with both their associated product and collections.
 * This is the most complete query for admin pages.
 *
 * @param filters - Optional filters to apply
 * @returns Array of artworks with product and collections data
 *
 * @example
 * ```typescript
 * // Get all artworks with products and collections
 * const artworks = await findArtworksWithProductsAndCollections({});
 * ```
 */
export async function findArtworksWithProductsAndCollections(
  filters: ArtworkFilters = {},
): Promise<ArtworkWithProductAndCollections[]> {
  // Get artworks first
  const matchedArtworks = await findArtworks(filters);

  if (matchedArtworks.length === 0) {
    return [];
  }

  // Get artwork IDs
  const artworkIds = matchedArtworks.map((a) => a.id);

  // Fetch products and collections in parallel
  const [artworkProducts, junctionData] = await Promise.all([
    // Fetch products for these artworks (type='artwork' only)
    db
      .select()
      .from(products)
      .where(
        and(
          inArray(products.artworkId, artworkIds),
          eq(products.type, "artwork"),
        ),
      ),
    // Fetch collections via junction table
    db
      .select({
        artworkId: artworksToCollections.artworkId,
        collection: collections,
      })
      .from(artworksToCollections)
      .innerJoin(
        collections,
        eq(artworksToCollections.collectionId, collections.id),
      )
      .where(inArray(artworksToCollections.artworkId, artworkIds)),
  ]);

  // Create a map of artworkId -> product
  const productByArtworkId = new Map<number, SelectProduct>();
  for (const product of artworkProducts) {
    if (product.artworkId !== null) {
      productByArtworkId.set(product.artworkId, product);
    }
  }

  // Create a map of artworkId -> collections
  const collectionsByArtworkId = new Map<number, SelectCollection[]>();
  for (const row of junctionData) {
    const existing = collectionsByArtworkId.get(row.artworkId) || [];
    existing.push(row.collection);
    collectionsByArtworkId.set(row.artworkId, existing);
  }

  // Combine artworks with their products and collections
  return matchedArtworks.map((artwork) => ({
    ...artwork,
    product: productByArtworkId.get(artwork.id) || null,
    collections: collectionsByArtworkId.get(artwork.id) || [],
  }));
}
