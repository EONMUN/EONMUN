"use server";

import { updateHomepageArtworkPositions } from "@/models/homepage-artworks";
import { auth } from "@/app/auth";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = void> {
  data?: T;
  error?: string;
}

export async function updateHomepageArtworks(
  artworkIds: number[]
): Promise<ActionResult> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    // Update homepage artworks
    await updateHomepageArtworkPositions(artworkIds);

    // Revalidate the homepage and admin page
    revalidatePath("/");
    revalidatePath("/admin/homepage");

    return { data: undefined };
  } catch (error) {
    console.error("Error updating homepage artworks:", error);
    return { error: "Failed to update homepage artworks" };
  }
}
