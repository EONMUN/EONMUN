"use server";

import { revalidatePath } from "next/cache";
import * as artworkModel from "@/models/artworks";
import type { Artwork, NewArtwork } from "@/models/artworks";
import { guardAuth, guardAdmin } from "@/lib/actions";
import { syncArtworkProduct, findArtworkProduct } from "@/models/product";
import {
  findArtworksWithProducts,
  findArtworkWithProduct,
  findArtworkWithProductBySlug,
  findArtworksWithProductsAndCollections,
  type ArtworkWithProduct,
  type ArtworkWithProductAndCollections,
} from "@/models/artwork";

export type { Artwork, ArtworkWithProduct, ArtworkWithProductAndCollections };

export async function getAllArtworksAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const artworks = await artworkModel.getAllArtworks();
    return { data: artworks };
  } catch (error) {
    console.error("Error fetching artworks:", error);
    throw error;
  }
}

/**
 * Get all artworks with their associated products (optimized single query).
 * Use this for admin list pages that need to display prices.
 */
export async function getAllArtworksWithProductsAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const artworks = await findArtworksWithProducts({});
    return { data: artworks };
  } catch (error) {
    console.error("Error fetching artworks with products:", error);
    throw error;
  }
}

/**
 * Get all artworks with their associated products and collections (optimized query).
 * Use this for admin list pages that need to display prices and collections.
 */
export async function getAllArtworksWithProductsAndCollectionsAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const artworks = await findArtworksWithProductsAndCollections({});
    return { data: artworks };
  } catch (error) {
    console.error(
      "Error fetching artworks with products and collections:",
      error,
    );
    throw error;
  }
}

/**
 * Get an artwork with its associated product by ID (optimized single query).
 */
export async function getArtworkWithProductByIdAdmin(id: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    return await findArtworkWithProduct(id);
  } catch (error) {
    console.error("Error fetching artwork with product:", error);
    throw error;
  }
}

/**
 * Get an artwork with its associated product by slug (optimized single query).
 */
export async function getArtworkWithProductBySlugAdmin(slug: string) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    return await findArtworkWithProductBySlug(slug);
  } catch (error) {
    console.error("Error fetching artwork with product:", error);
    throw error;
  }
}

export async function getArtworkByIdAdmin(id: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const artwork = await artworkModel.getArtworkById(id);
    return artwork;
  } catch (error) {
    console.error("Error fetching artwork:", error);
    throw error;
  }
}

export async function getArtworkBySlugAdmin(slug: string) {
  const authError = await guardAuth();
  console.log(authError);
  if (authError) return null;

  try {
    const artwork = await artworkModel.getArtworkBySlug(slug);
    console.log(artwork);
    return artwork;
  } catch (error) {
    console.error("Error fetching artwork:", error);
    throw error;
  }
}

export async function createArtworkAdmin(
  data: Omit<NewArtwork, "createdAt" | "updatedAt"> & { price?: number },
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    // Extract price from data (it will be used for product, not artwork)
    // Price comes in as dollars, convert to cents for storage
    const { price, ...artworkData } = data;
    const priceInCents =
      price !== undefined ? Math.round(price * 100) : undefined;
    const artwork = await artworkModel.createArtwork(artworkData);

    // Sync product if price is provided
    // Note: defaultImageUrl is null for newly created artworks (images added separately)
    if (priceInCents !== undefined) {
      await syncArtworkProduct(artwork.id, priceInCents, {
        title: artwork.title,
        slug: artwork.slug,
        description: artwork.description,
        defaultImageUrl: null,
      });
    }

    revalidatePath("/admin/artworks");
    revalidatePath("/store");
    return { success: true, data: artwork };
  } catch (error) {
    console.error("Error creating artwork:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create artwork",
    };
  }
}

export async function updateArtworkAdmin(
  id: number,
  data: Partial<Omit<NewArtwork, "createdAt" | "updatedAt">> & {
    price?: number | null;
  },
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    // Extract price from data (it will be used for product, not artwork)
    // Price comes in as dollars, convert to cents for storage
    const { price, ...artworkData } = data;
    const priceInCents =
      price !== undefined
        ? price === null
          ? null
          : Math.round(price * 100)
        : undefined;
    const artwork = await artworkModel.updateArtwork(id, artworkData);
    if (!artwork) {
      return { success: false, error: "Artwork not found" };
    }

    // Sync product if price is provided (including explicit null to clear)
    // Note: We need to fetch the default image URL separately since it's now in artwork_images table
    if (priceInCents !== undefined) {
      // Get the default image URL from artworkImages
      const artworkWithProduct = await findArtworkWithProduct(artwork.id);
      await syncArtworkProduct(artwork.id, priceInCents, {
        title: artwork.title,
        slug: artwork.slug,
        description: artwork.description,
        defaultImageUrl: artworkWithProduct?.defaultImageUrl ?? null,
      });
    }

    revalidatePath("/admin/artworks");
    revalidatePath("/store");
    return { success: true, data: artwork };
  } catch (error) {
    console.error("Error updating artwork:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update artwork",
    };
  }
}

/**
 * Get the product associated with an artwork.
 */
export async function getProductForArtworkAdmin(artworkId: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    return await findArtworkProduct(artworkId);
  } catch (error) {
    console.error("Error fetching product for artwork:", error);
    return null;
  }
}

export async function deleteArtworkAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await artworkModel.deleteArtwork(id);
    revalidatePath("/admin/artworks");
    return { success: true };
  } catch (error) {
    console.error("Error deleting artwork:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete artwork",
    };
  }
}
