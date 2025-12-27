"use server";

import { revalidatePath } from "next/cache";
import { eq, isNotNull, asc } from "drizzle-orm";
import { db, artworks } from "@/database";
import { guardAdmin } from "@/lib/actions";

export interface HomePageArtwork {
  id: number;
  title: string;
  slug: string;
  defaultImageUrl: string | null;
  homePageOrder: number | null;
}

/**
 * Get all artworks that are set to appear on the home page (have a homePageOrder)
 */
export async function getHomePageArtworksAdmin() {
  const authError = await guardAdmin();
  if (authError) return { error: authError.error };

  try {
    const results = await db
      .select({
        id: artworks.id,
        title: artworks.title,
        slug: artworks.slug,
        defaultImageUrl: artworks.defaultImageUrl,
        homePageOrder: artworks.homePageOrder,
      })
      .from(artworks)
      .where(isNotNull(artworks.homePageOrder))
      .orderBy(asc(artworks.homePageOrder));

    return { data: results };
  } catch (error) {
    console.error("Error fetching home page artworks:", error);
    return { error: "Failed to fetch home page artworks" };
  }
}

/**
 * Get all published artworks that could be added to the home page
 */
export async function getAvailableArtworksForHomeAdmin() {
  const authError = await guardAdmin();
  if (authError) return { error: authError.error };

  try {
    const results = await db
      .select({
        id: artworks.id,
        title: artworks.title,
        slug: artworks.slug,
        defaultImageUrl: artworks.defaultImageUrl,
        homePageOrder: artworks.homePageOrder,
      })
      .from(artworks)
      .where(isNotNull(artworks.publishedAt));

    return { data: results };
  } catch (error) {
    console.error("Error fetching available artworks:", error);
    return { error: "Failed to fetch available artworks" };
  }
}

/**
 * Update the home page order for multiple artworks
 * Pass an array of artwork IDs in the desired order
 * Artworks not in the array will have their homePageOrder set to null
 */
export async function updateHomePageOrderAdmin(artworkIds: number[]) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    // First, clear all homePageOrder values
    await db
      .update(artworks)
      .set({ homePageOrder: null, updatedAt: new Date() })
      .where(isNotNull(artworks.homePageOrder));

    // Then set the new order for selected artworks
    for (let i = 0; i < artworkIds.length; i++) {
      await db
        .update(artworks)
        .set({ homePageOrder: i + 1, updatedAt: new Date() })
        .where(eq(artworks.id, artworkIds[i]));
    }

    revalidatePath("/admin/home");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating home page order:", error);
    return { success: false, error: "Failed to update home page order" };
  }
}

/**
 * Add an artwork to the home page (at the end of the list)
 */
export async function addArtworkToHomePageAdmin(artworkId: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    // Get the current maximum order
    const existing = await db
      .select({ homePageOrder: artworks.homePageOrder })
      .from(artworks)
      .where(isNotNull(artworks.homePageOrder))
      .orderBy(asc(artworks.homePageOrder));

    const maxOrder =
      existing.length > 0
        ? Math.max(...existing.map((a) => a.homePageOrder ?? 0))
        : 0;

    // Add the artwork with the next order
    await db
      .update(artworks)
      .set({ homePageOrder: maxOrder + 1, updatedAt: new Date() })
      .where(eq(artworks.id, artworkId));

    revalidatePath("/admin/home");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error adding artwork to home page:", error);
    return { success: false, error: "Failed to add artwork to home page" };
  }
}

/**
 * Remove an artwork from the home page
 */
export async function removeArtworkFromHomePageAdmin(artworkId: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await db
      .update(artworks)
      .set({ homePageOrder: null, updatedAt: new Date() })
      .where(eq(artworks.id, artworkId));

    revalidatePath("/admin/home");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error removing artwork from home page:", error);
    return {
      success: false,
      error: "Failed to remove artwork from home page",
    };
  }
}
