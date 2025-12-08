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

import { eq, inArray, and, isNull, gt, or } from 'drizzle-orm';
import { db, products, artworks } from '@/database';
import type { SelectProduct } from '@/database/factories/product.factory';
import type { SelectArtwork } from '@/database/factories/artwork.factory';

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
export async function findProducts(filters: ProductFilters = {}): Promise<SelectProduct[]> {
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
        and(eq(products.type, 'artwork'), isNull(products.soldAt)),
        // Quantity items (print, postcard): quantity > 0
        gt(products.quantity, 0)
      )
    );
  } else if (filters.available === false) {
    // Not available means: sold OR out of stock
    conditions.push(
      or(
        // Sold unique items
        and(eq(products.type, 'artwork'), eq(products.soldAt, products.soldAt)), // soldAt IS NOT NULL
        // Out of stock quantity items
        and(eq(products.quantity, 0))
      )
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
export async function findAvailableProducts(type?: string): Promise<SelectProduct[]> {
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
  filters: ProductFilters = {}
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

  // Fetch artworks
  const artworkData = await db
    .select()
    .from(artworks)
    .where(inArray(artworks.id, artworkIds));

  // Create a map of artwork by ID
  const artworkById = new Map<number, SelectArtwork>();
  for (const artwork of artworkData) {
    artworkById.set(artwork.id, artwork);
  }

  // Combine products with artworks
  return matchedProducts.map((product) => ({
    ...product,
    artwork: product.artworkId ? artworkById.get(product.artworkId) || null : null,
  }));
}

/**
 * Mark a product as sold.
 * Sets soldAt to current timestamp.
 *
 * @param id - Product ID
 * @returns Updated product or null if not found
 */
export async function markProductSold(id: number): Promise<SelectProduct | null> {
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
  amount: number = 1
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

export type { SelectProduct };
