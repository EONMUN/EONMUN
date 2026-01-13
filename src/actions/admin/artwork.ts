"use server";

import { revalidatePath } from "next/cache";
import { db, artworkImages } from "@/database";
import { eq, and } from "drizzle-orm";
import * as artworkModel from "@/models/artworks";
import type { Artwork, NewArtwork } from "@/models/artworks";
import { guardAuth, guardAdmin } from "@/lib/actions";
import { syncArtworkProduct, findArtworkProduct } from "@/models/product";
import {
  findArtworksWithProducts,
  findArtworkWithProduct,
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
 * Get an artwork with its associated product, collections, and images by slug.
 */
export async function getArtworkWithProductBySlugAdmin(slug: string) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const [artwork] = await findArtworksWithProductsAndCollections({
      slug: [slug],
    });
    return artwork || null;
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
  data: Omit<NewArtwork, "createdAt" | "updatedAt"> & {
    price?: number;
    published?: boolean;
    defaultImageUrl?: string;
    images?: { url: string; isDefault: boolean; caption?: string | null }[];
  },
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    // Extract price and published from data
    // Price comes in as dollars, convert to cents for storage
    const { price, published, defaultImageUrl, images, ...artworkData } = data;
    const priceInCents =
      price !== undefined ? Math.round(price * 100) : undefined;
    // Set publishedAt based on the published checkbox (defaults to true)
    const artwork = await artworkModel.createArtwork({
      ...artworkData,
      publishedAt: published !== false ? new Date() : null,
    });

    // Save images
    if (images && images.length > 0) {
      await db.insert(artworkImages).values(
        images.map((img) => ({
          artworkId: artwork.id,
          url: img.url,
          isDefault: img.isDefault,
          caption: img.caption,
        })),
      );
    } else if (defaultImageUrl) {
      // Fallback for single image
      await db.insert(artworkImages).values({
        artworkId: artwork.id,
        url: defaultImageUrl,
        isDefault: true,
      });
    }

    // Sync product if price is provided
    if (priceInCents !== undefined) {
      let defaultUrl = null;
      if (images && images.length > 0) {
        const defaultImg = images.find((img) => img.isDefault);
        defaultUrl = defaultImg ? defaultImg.url : images[0].url;
      } else if (defaultImageUrl) {
        defaultUrl = defaultImageUrl;
      }

      await syncArtworkProduct(artwork.id, priceInCents, {
        title: artwork.title,
        slug: artwork.slug,
        description: artwork.description,
        defaultImageUrl: defaultUrl,
      });
    }

    revalidatePath("/admin/artworks");
    revalidatePath("/store");
    revalidatePath("/artworks");
    revalidatePath(`/artworks/${artwork.slug}`);
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
    published?: boolean;
    defaultImageUrl?: string | null;
    images?: { url: string; isDefault: boolean; caption?: string | null }[];
  },
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    // Extract price, published from data
    // Price comes in as dollars, convert to cents for storage
    const { price, published, defaultImageUrl, images, ...artworkData } = data;
    const priceInCents =
      price !== undefined
        ? price === null
          ? null
          : Math.round(price * 100)
        : undefined;
    
    // Handle publishedAt based on the published checkbox
    const updateData = { ...artworkData };
    if (published !== undefined) {
      updateData.publishedAt = published ? new Date() : null;
    }
    
    const artwork = await artworkModel.updateArtwork(id, updateData);
    if (!artwork) {
      return { success: false, error: "Artwork not found" };
    }

    // Handle image update
    if (images !== undefined) {
      // Sync images: Delete all existing and insert new ones
      await db.delete(artworkImages).where(eq(artworkImages.artworkId, id));

      if (images.length > 0) {
        await db.insert(artworkImages).values(
          images.map((img) => ({
            artworkId: id,
            url: img.url,
            isDefault: img.isDefault,
            caption: img.caption,
          })),
        );
      }
    } else if (defaultImageUrl !== undefined) {
      // Fallback for single image update
      if (defaultImageUrl === null || defaultImageUrl === "") {
        // Remove default image
        await db
          .delete(artworkImages)
          .where(
            and(
              eq(artworkImages.artworkId, id),
              eq(artworkImages.isDefault, true),
            ),
          );
      } else {
        // Upsert default image
        const [existing] = await db
          .select()
          .from(artworkImages)
          .where(
            and(
              eq(artworkImages.artworkId, id),
              eq(artworkImages.isDefault, true),
            ),
          );

        if (existing) {
          await db
            .update(artworkImages)
            .set({ url: defaultImageUrl, updatedAt: new Date() })
            .where(eq(artworkImages.id, existing.id));
        } else {
          await db.insert(artworkImages).values({
            artworkId: id,
            url: defaultImageUrl,
            isDefault: true,
          });
        }
      }
    }

    // Sync product if price is provided (including explicit null to clear)
    // Note: We need to fetch the default image URL separately since it's now in artwork_images table
    if (priceInCents !== undefined) {
      // Get the default image URL to sync
      let urlToSync: string | null | undefined = undefined;

      if (images) {
        const defaultImg = images.find((img) => img.isDefault);
        urlToSync = defaultImg
          ? defaultImg.url
          : images.length > 0
            ? images[0].url
            : null;
      } else if (defaultImageUrl !== undefined) {
        urlToSync = defaultImageUrl;
      }

      // If defaultImageUrl was not part of the update, fetch current one
      if (urlToSync === undefined) {
        const artworkWithProduct = await findArtworkWithProduct(artwork.id);
        urlToSync = artworkWithProduct?.defaultImageUrl;
      }

      // Convert empty string to null for product sync
      if (urlToSync === "") urlToSync = null;

      await syncArtworkProduct(artwork.id, priceInCents, {
        title: artwork.title,
        slug: artwork.slug,
        description: artwork.description,
        defaultImageUrl: urlToSync ?? null,
      });
    }

    revalidatePath("/admin/artworks");
    revalidatePath("/store");
    revalidatePath("/artworks");
    revalidatePath(`/artworks/${artwork.slug}`);
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
