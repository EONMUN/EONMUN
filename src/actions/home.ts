'use server';

import { findArtworksWithCollections } from '@/models/artwork';
import { getHomepageArtworks } from '@/models/homepage-artworks';
import type { ArtworkWithCollections } from '@/models/artwork';

export interface HomePageData {
  slides: ArtworkWithCollections[];
}

export async function getHomePageData(): Promise<HomePageData> {
  // First, try to get configured homepage artworks
  let slides = await getHomepageArtworks();

  // If no homepage artworks are configured, fallback to the old behavior
  // (showing artworks that are default for collections)
  if (slides.length === 0) {
    slides = await findArtworksWithCollections({
      published: true,
      isDefaultForCollection: true,
    });
  }

  return { slides };
}
