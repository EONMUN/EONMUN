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

import { eq, inArray, and, isNotNull, isNull } from "drizzle-orm";
import {
  db,
  artworks,
  collections,
  artworksToCollections,
  products,
  artworkImages,
  type SelectArtwork as BaseSelectArtwork,
  type SelectCollection,
  type SelectProduct,
} from "@/database";

/**
 * Artwork with default image URL (computed from artworkImages join)
 */
export interface SelectArtwork extends BaseSelectArtwork {
  defaultImageUrl: string | null;
}

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
  images: { url: string; isDefault: boolean; caption: string | null }[];
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

  // Execute query with conditions and join with artworkImages for default image
  const query = db
    .select({
      id: artworks.id,
      title: artworks.title,
      slug: artworks.slug,
      description: artworks.description,
      artist: artworks.artist,
      year: artworks.year,
      width: artworks.width,
      height: artworks.height,
      depth: artworks.depth,
      dimensionUnit: artworks.dimensionUnit,
      publishedAt: artworks.publishedAt,
      locale: artworks.locale,
      createdAt: artworks.createdAt,
      updatedAt: artworks.updatedAt,
      defaultImageUrl: artworkImages.url,
    })
    .from(artworks)
    .leftJoin(
      artworkImages,
      and(
        eq(artworks.id, artworkImages.artworkId),
        eq(artworkImages.isDefault, true),
      ),
    );

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const results = await query;

  return results as SelectArtwork[];
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
  const matchedArtworks = await findArtworks(filters);

  if (matchedArtworks.length === 0) {
    return [];
  }

  const artworkIds = matchedArtworks.map((a) => a.id);

  // Fetch collections
  const junctionConditions = [];
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

  const collectionQuery = db
    .select({
      artworkId: artworksToCollections.artworkId,
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

  const collectionData = await collectionQuery;

  // Fetch images
  const imagesQuery = db
    .select()
    .from(artworkImages)
    .where(inArray(artworkImages.artworkId, artworkIds));

  const imagesData = await imagesQuery;

  // Group collections by artwork ID
  const collectionsByArtworkId = new Map<number, SelectCollection[]>();
  for (const row of collectionData) {
    const existing = collectionsByArtworkId.get(row.artworkId) || [];
    existing.push(row.collection);
    collectionsByArtworkId.set(row.artworkId, existing);
  }

  // Group images by artwork ID
  const imagesByArtworkId = new Map<
    number,
    { url: string; isDefault: boolean; caption: string | null }[]
  >();
  for (const img of imagesData) {
    const existing = imagesByArtworkId.get(img.artworkId) || [];
    existing.push({
      url: img.url,
      isDefault: img.isDefault ?? false,
      caption: img.caption,
    });
    imagesByArtworkId.set(img.artworkId, existing);
  }

  // Filter artworks if specific collection filters were applied
  // (Note: matchedArtworks already has basic filters, but collection junction filtering happens here)
  const filteredArtworks =
    junctionConditions.length > 0
      ? matchedArtworks.filter((artwork) =>
          collectionsByArtworkId.has(artwork.id),
        )
      : matchedArtworks;

  // Combine data
  return filteredArtworks.map((artwork) => ({
    ...artwork,
    collections: collectionsByArtworkId.get(artwork.id) || [],
    images: imagesByArtworkId.get(artwork.id) || [],
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
