'use server';

import { findArtworksWithCollections } from '@/models/artwork';
import type { ArtworkWithCollections } from '@/models/artwork';

export interface HomePageData {
  slides: ArtworkWithCollections[];
}

export async function getHomePageData(): Promise<HomePageData> {
  const slides = await findArtworksWithCollections({
    published: true,
    isDefaultForCollection: true,
  });

  return { slides };
}
