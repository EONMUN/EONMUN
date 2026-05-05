import { MetadataRoute } from 'next';
import { getAllCollections } from '@/actions/collection';
import { getAllArtworks } from '@/actions/artwork';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL for the site — mirrors metadata.ts precedence so sitemap and
  // og:url always agree on the canonical host.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://eonmun.com';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artworks`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  try {
    // Fetch all collections
    const collectionsResponse = await getAllCollections();
    const collections = collectionsResponse.data;

    // Generate collection routes
    const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
      url: `${baseUrl}/collections/${collection.slug}`,
      lastModified: new Date(collection.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    // Fetch all artworks
    const artworksResponse = await getAllArtworks();
    const artworks = artworksResponse.data;

    // Generate artwork routes
    const artworkRoutes: MetadataRoute.Sitemap = artworks.map((artwork) => ({
      url: `${baseUrl}/artworks/${artwork.slug}`,
      lastModified: new Date(artwork.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

    // Combine all routes
    return [...staticRoutes, ...collectionRoutes, ...artworkRoutes];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return only static routes if API fails
    return staticRoutes;
  }
} 