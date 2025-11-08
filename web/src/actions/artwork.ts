'use server';

import { findArtworks, findArtworksWithCollections } from '@/models/artwork';
import type { ArtworkWithCollections } from '@/models/artwork';

/**
 * Get an artwork by its slug.
 * Returns the artwork with collection data or null if not found.
 */
export async function getArtworkBySlug(slug: string): Promise<ArtworkWithCollections | null> {
  const artworks = await findArtworksWithCollections({
    slug: [slug],
    published: true, // Only return published artworks
  });

  return artworks[0] || null;
}

/**
 * Get all artworks with their collection data.
 * Only returns published artworks by default.
 */
export async function getAllArtworks(params?: {
  published?: boolean;
  collectionId?: number[];
  year?: number[];
  locale?: string[];
}) {
  const artworks = await findArtworksWithCollections({
    published: params?.published ?? true, // Default to published only
    collectionId: params?.collectionId,
    year: params?.year,
    locale: params?.locale,
  });

  return {
    data: artworks,
    meta: {
      total: artworks.length,
    },
  };
}

/**
 * Get an artwork by its ID.
 * Returns the artwork with collection data or null if not found.
 */
export async function getArtworkById(id: number): Promise<ArtworkWithCollections | null> {
  const artworks = await findArtworksWithCollections({
    id: [id],
  });

  return artworks[0] || null;
}
