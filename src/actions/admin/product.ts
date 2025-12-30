"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, products, type InsertProduct } from "@/database";
import { findProductsWithArtwork, markProductSold } from "@/models/product";
import type { SelectProduct, ProductWithArtwork } from "@/models/product";
import { guardAuth, guardAdmin } from "@/lib/actions";

export type { SelectProduct, ProductWithArtwork };

/**
 * Get all products (admin view - includes sold items)
 */
export async function getAllProductsAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const productList = await findProductsWithArtwork({});
    return { data: productList };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Get a product by ID (admin view)
 */
export async function getProductByIdAdmin(
  id: number,
): Promise<ProductWithArtwork | null> {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const [product] = await findProductsWithArtwork({ id: [id] });
    return product || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

/**
 * Get a product by slug (admin view)
 */
export async function getProductBySlugAdmin(
  slug: string,
): Promise<ProductWithArtwork | null> {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const [product] = await findProductsWithArtwork({ slug: [slug] });
    return product || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

/**
 * Create a new product.
 * listedAt is automatically set on creation.
 */
export async function createProductAdmin(
  data: Omit<InsertProduct, "id" | "createdAt" | "updatedAt" | "listedAt">,
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const [product] = await db
      .insert(products)
      .values({
        ...data,
        // listedAt is auto-set by schema default
      })
      .returning();

    revalidatePath("/admin/products");
    revalidatePath("/store");
    return { success: true, data: product };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

/**
 * Update a product.
 */
export async function updateProductAdmin(
  id: number,
  data: Partial<Omit<InsertProduct, "id" | "createdAt" | "listedAt">>,
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const [product] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/admin/products");
    revalidatePath("/store");
    revalidatePath(`/store/${product.slug}`);
    return { success: true, data: product };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

/**
 * Mark a product as sold (manual marking).
 */
export async function markProductSoldAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const product = await markProductSold(id);

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/admin/products");
    revalidatePath("/store");
    revalidatePath(`/store/${product.slug}`);
    return { success: true, data: product };
  } catch (error) {
    console.error("Error marking product as sold:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark product as sold",
    };
  }
}

/**
 * Delete a product.
 */
export async function deleteProductAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/admin/products");
    revalidatePath("/store");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
