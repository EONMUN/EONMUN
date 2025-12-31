/**
 * Product model functions for querying products from the database.
 *
 * Products represent items for sale in the store (artworks, prints, postcards, etc.)
 *
 * @example
 * ```typescript
 * // Get all available products for the store
 * const storeProducts = await findAvailableProducts();
 *
 * // Get product by slug
 * const [product] = await findProducts({ slug: ['my-product'] });
 *
 * // Get artwork products only
 * const artworkProducts = await findProducts({ type: ['artwork'] });
 *
 * // Get products with their artwork data
 * const productsWithArtwork = await findProductsWithArtwork({ type: ['artwork'] });
 * ```
 */

import { eq, inArray, and, isNull, isNotNull, gt, or } from "drizzle-orm";
import {
  db,
  products,
  artworks,
  artworkImages,
  type SelectProduct,
} from "@/database";
import type { SelectArtwork } from "@/models/artwork";

/**
 * Filters for querying products
 */
export interface ProductFilters {
  /** Filter by product IDs */
  id?: number[];
  /** Filter by product slugs */
  slug?: string[];
  /** Filter by product types */
  type?: string[];
  /** Filter by artwork IDs */
  artworkId?: number[];
  /** Filter by availability (true = available, false = sold/out of stock) */
  available?: boolean;
}

/**
 * Product with artwork relation
 */
export interface ProductWithArtwork extends SelectProduct {
  artwork: SelectArtwork | null;
}

/**
 * Find products based on filters.
 * Always returns an array, even for single results.
 *
 * @param filters - Optional filters to apply
 * @returns Array of products matching the filters
 */
export async function findProducts(
  filters: ProductFilters = {},
): Promise<SelectProduct[]> {
  const conditions = [];

  if (filters.id && filters.id.length > 0) {
    conditions.push(inArray(products.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    conditions.push(inArray(products.slug, filters.slug));
  }

  if (filters.type && filters.type.length > 0) {
    conditions.push(inArray(products.type, filters.type));
  }

  if (filters.artworkId && filters.artworkId.length > 0) {
    conditions.push(inArray(products.artworkId, filters.artworkId));
  }

  if (filters.available === true) {
    // Available means: not sold (for unique items) OR has stock (for quantity items)
    conditions.push(
      or(
        // Unique items (artwork): soldAt is null
        and(eq(products.type, "artwork"), isNull(products.soldAt)),
        // Quantity items (print, postcard): quantity > 0
        gt(products.quantity, 0),
      ),
    );
  } else if (filters.available === false) {
    // Not available means: sold OR out of stock
    conditions.push(
      or(
        // Sold unique items
        and(eq(products.type, "artwork"), isNotNull(products.soldAt)),
        // Out of stock quantity items
        and(eq(products.quantity, 0)),
      ),
    );
  }

  const query = db.select().from(products);

  if (conditions.length > 0) {
    return await query.where(and(...conditions));
  }

  return await query;
}

/**
 * Find available products for the store.
 * Returns products that are not sold and have stock (if applicable).
 *
 * @param type - Optional type filter (e.g., 'artwork', 'print')
 * @returns Array of available products
 */
export async function findAvailableProducts(
  type?: string,
): Promise<SelectProduct[]> {
  const filters: ProductFilters = { available: true };
  if (type) {
    filters.type = [type];
  }
  return findProducts(filters);
}

/**
 * Find products with their artwork data.
 *
 * @param filters - Optional filters to apply
 * @returns Array of products with artwork data
 */
export async function findProductsWithArtwork(
  filters: ProductFilters = {},
): Promise<ProductWithArtwork[]> {
  // Get products first
  const matchedProducts = await findProducts(filters);

  if (matchedProducts.length === 0) {
    return [];
  }

  // Get artwork IDs from products
  const artworkIds = matchedProducts
    .map((p) => p.artworkId)
    .filter((id): id is number => id !== null);

  if (artworkIds.length === 0) {
    // No artworks to fetch, return products with null artwork
    return matchedProducts.map((product) => ({
      ...product,
      artwork: null,
    }));
  }

  // Fetch artworks with their default images
  const artworkData = await db
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
    )
    .where(inArray(artworks.id, artworkIds));

  // Create a map of artwork by ID
  const artworkById = new Map<number, SelectArtwork>();
  for (const artwork of artworkData) {
    artworkById.set(artwork.id, artwork as SelectArtwork);
  }

  // Combine products with artworks
  return matchedProducts.map((product) => ({
    ...product,
    artwork: product.artworkId
      ? artworkById.get(product.artworkId) || null
      : null,
  }));
}

/**
 * Mark a product as sold.
 * Sets soldAt to current timestamp.
 *
 * @param id - Product ID
 * @returns Updated product or null if not found
 */
export async function markProductSold(
  id: number,
): Promise<SelectProduct | null> {
  const [updated] = await db
    .update(products)
    .set({
      soldAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  return updated || null;
}

/**
 * Decrement product quantity by amount.
 * Used for quantity-based products (prints, postcards).
 *
 * @param id - Product ID
 * @param amount - Amount to decrement (default: 1)
 * @returns Updated product or null if not found
 */
export async function decrementProductQuantity(
  id: number,
  amount: number = 1,
): Promise<SelectProduct | null> {
  // Get current product
  const [product] = await findProducts({ id: [id] });
  if (!product || product.quantity === null) {
    return null;
  }

  const newQuantity = Math.max(0, product.quantity - amount);

  const [updated] = await db
    .update(products)
    .set({
      quantity: newQuantity,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();

  return updated || null;
}

/**
 * Find the artwork-type product for a given artwork.
 *
 * @param artworkId - The artwork ID
 * @returns The product or null if not found
 */
export async function findArtworkProduct(
  artworkId: number,
): Promise<SelectProduct | null> {
  const [product] = await db
    .select()
    .from(products)
    .where(
      and(eq(products.artworkId, artworkId), eq(products.type, "artwork")),
    );

  return product || null;
}

/**
 * Sync product for an artwork based on price.
 * - If price is provided and no product exists: create product
 * - If price is provided and product exists: update product price
 * - If price is null/undefined and product exists: throw error
 *
 * @param artworkId - The artwork ID
 * @param price - Price in cents (null/undefined means no price)
 * @param artworkData - Artwork data for populating product fields
 * @returns The synced product or null if no price and no product
 * @throws Error if trying to clear price when product exists
 */
export async function syncArtworkProduct(
  artworkId: number,
  price: number | null | undefined,
  artworkData: {
    title: string;
    slug: string;
    description?: string | null;
    defaultImageUrl?: string | null;
  },
): Promise<SelectProduct | null> {
  // Check for existing product
  const existingProduct = await findArtworkProduct(artworkId);

  // If no price provided
  if (price === null || price === undefined) {
    if (existingProduct) {
      throw new Error(
        "Cannot clear price when product exists. Delete the product first.",
      );
    }
    return null;
  }

  // Price is provided - create or update product
  if (existingProduct) {
    // Update existing product price
    const [updated] = await db
      .update(products)
      .set({
        price,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existingProduct.id))
      .returning();

    return updated || null;
  }

  // Create new product
  // Check for slug conflict and append suffix if needed
  let productSlug = artworkData.slug;
  const [existingSlug] = await db
    .select()
    .from(products)
    .where(eq(products.slug, productSlug));

  if (existingSlug) {
    productSlug = `${artworkData.slug}-product`;
  }

  const [created] = await db
    .insert(products)
    .values({
      type: "artwork",
      artworkId,
      name: artworkData.title,
      slug: productSlug,
      description: artworkData.description,
      imageUrl: artworkData.defaultImageUrl,
      price,
      quantity: null, // Unique item
      // listedAt auto-set by schema default
    })
    .returning();

  return created || null;
}

export type { SelectProduct };
