'use server';

import { findProducts, findProductsWithArtwork, findAvailableProducts } from '@/models/product';
import type { ProductWithArtwork } from '@/models/product';

/**
 * Get a product by its slug.
 * Returns the product with artwork data or null if not found.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithArtwork | null> {
  const products = await findProductsWithArtwork({
    slug: [slug],
  });

  return products[0] || null;
}

/**
 * Get a product by its ID.
 * Returns the product with artwork data or null if not found.
 */
export async function getProductById(id: number): Promise<ProductWithArtwork | null> {
  const products = await findProductsWithArtwork({
    id: [id],
  });

  return products[0] || null;
}

/**
 * Get all available products for the store.
 * Only returns products that are not sold and have stock.
 */
export async function getAvailableProducts(params?: {
  type?: string;
}) {
  const products = await findAvailableProducts(params?.type);

  return {
    data: products,
    meta: {
      total: products.length,
    },
  };
}

/**
 * Get all available products with their artwork data.
 * Only returns products that are not sold and have stock.
 */
export async function getAvailableProductsWithArtwork(params?: {
  type?: string;
}) {
  const products = await findProductsWithArtwork({
    available: true,
    type: params?.type ? [params.type] : undefined,
  });

  return {
    data: products,
    meta: {
      total: products.length,
    },
  };
}

/**
 * Get all products (including sold/out of stock).
 * Useful for admin views.
 */
export async function getAllProducts(params?: {
  type?: string[];
  available?: boolean;
}) {
  const products = await findProducts({
    type: params?.type,
    available: params?.available,
  });

  return {
    data: products,
    meta: {
      total: products.length,
    },
  };
}
