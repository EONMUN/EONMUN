import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // Base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://eonmun.com';

  // Self-contained sitemap with all art pages - no external dependencies
  const routes: MetadataRoute.Sitemap = [
    // Main site routes
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
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    
    // Art listing pages - high priority
    {
      url: `${baseUrl}/artworks`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    
    // NFT related pages
    {
      url: `${baseUrl}/nfts`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nfts/emn/mint`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // Purchase related pages
    {
      url: `${baseUrl}/purchase`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  return routes;
} 