'use server';

import { getHomepageArtworks } from '@/models/homepage-artworks';
import type { ArtworkWithCollections } from '@/models/artwork';

export interface HomePageData {
  slides: ArtworkWithCollections[];
}

export async function getHomePageData(): Promise<HomePageData> {
  const slides = await getHomepageArtworks();
  return { slides };
}
