'use server';

import { findCollections, findCollectionsWithArtworks } from '@/models/collection';
import type { CollectionWithArtworks } from '@/models/collection';

/**
 * Get a collection by its slug.
 * Returns the collection with artworks data or null if not found.
 */
export async function getCollectionBySlug(slug: string): Promise<CollectionWithArtworks | null> {
  const collections = await findCollectionsWithArtworks({
    slug: [slug],
    published: true, // Only return published collections
  });

  return collections[0] || null;
}

/**
 * Get all collections with their artworks.
 * Only returns published collections by default.
 */
export async function getAllCollections(params?: {
  published?: boolean;
  locale?: string[];
}) {
  const collections = await findCollectionsWithArtworks({
    published: params?.published ?? true, // Default to published only
    locale: params?.locale,
  });

  return {
    data: collections,
    meta: {
      total: collections.length,
    },
  };
}

/**
 * Get a collection by its ID.
 * Returns the collection with artworks data or null if not found.
 */
export async function getCollectionById(id: number): Promise<CollectionWithArtworks | null> {
  const collections = await findCollectionsWithArtworks({
    id: [id],
  });

  return collections[0] || null;
}
