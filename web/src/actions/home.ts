'use server';

import { strapiClient, Artwork } from '@/lib/strapi';

export interface HomePageData {
  slides: Artwork[];
}

export async function getHomePageData(): Promise<HomePageData> {
  const { data } = await strapiClient.single("home").find({
    populate: {
      slides: {
        populate: {
          default_image: true,
          collections: true,
        },
      },
    },
  });

  return data as unknown as HomePageData;
}
