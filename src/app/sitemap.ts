import { MetadataRoute } from "next";
import { getAllCollections } from "@/actions/collection";
import { getAllArtworks } from "@/actions/artwork";
import { getAllPublishedPosts } from "@/actions/post";
import { getAvailableProducts } from "@/actions/product";

// SEO sitemap. Includes every public, indexable URL on the marketing site.
// Excludes /admin, /purchase, /nfts, /auth, and any non-public routes.
// Falls back to static routes only if any DB call fails — better an incomplete
// sitemap than a 500 that drops us out of search-engine indexes entirely.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL for the site — NEXT_PUBLIC_APP_URL is the canonical site-URL
  // env var (Stripe checkout, cloudflare-env.d.ts, all .env.*.example files).
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://eonmun.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artworks`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    // Both calls default to published=true, but pass explicitly so future
    // changes to action defaults can't silently leak drafts into the sitemap.
    const [
      { data: collections },
      { data: artworks },
      { data: posts },
      { data: products },
    ] = await Promise.all([
      getAllCollections({ published: true }),
      getAllArtworks({ published: true }),
      getAllPublishedPosts(),
      getAvailableProducts(),
    ]);

    const collectionRoutes: MetadataRoute.Sitemap = collections.map(
      (collection) => ({
        url: `${baseUrl}/collections/${collection.slug}`,
        lastModified: new Date(collection.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }),
    );

    const artworkRoutes: MetadataRoute.Sitemap = artworks.map((artwork) => ({
      url: `${baseUrl}/artworks/${artwork.slug}`,
      lastModified: new Date(artwork.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/store/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...collectionRoutes,
      ...artworkRoutes,
      ...postRoutes,
      ...productRoutes,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticRoutes;
  }
}
