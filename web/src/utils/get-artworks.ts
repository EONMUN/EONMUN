import { strapiClient } from '@/lib/strapi';

export async function getArtworks() {
  try {
    const response = await strapiClient.find('artworks', {
      populate: {
        default_image: true,
        collections: true,
      },
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error fetching artworks:', error);
    return [];
  }
}