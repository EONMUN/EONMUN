"use server";

import { findArtworksWithCollections } from "@/models/artwork";
import type { ArtworkWithCollections } from "@/models/artwork";

export interface HomePageData {
  slides: ArtworkWithCollections[];
}

export async function getHomePageData(): Promise<HomePageData> {
  // First, try to get artworks with explicit home page ordering
  let slides = await findArtworksWithCollections({
    published: true,
    onHomePage: true,
    orderByHomePageOrder: true,
  });

  // Fallback: if no artworks have homePageOrder set, use the old behavior
  // (artworks marked as default for their collection)
  if (slides.length === 0) {
    slides = await findArtworksWithCollections({
      published: true,
      isDefaultForCollection: true,
    });
  }

  return { slides };
}
