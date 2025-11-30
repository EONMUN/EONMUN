import { eq, and, like, or, sql } from 'drizzle-orm';
import { db, facets, artworksToFacets, artworks } from '@/database';

export type Facet = typeof facets.$inferSelect;
export type NewFacet = typeof facets.$inferInsert;

export type FacetType = 'material' | 'technique' | 'style';

export const FACET_TYPES = {
  MATERIAL: 'material',
  TECHNIQUE: 'technique',
  STYLE: 'style',
} as const;

/**
 * Get all facets, optionally filtered by type
 */
export async function getAllFacets(type?: string): Promise<Facet[]> {
  if (type) {
    return db.select().from(facets).where(eq(facets.type, type));
  }
  return db.select().from(facets);
}

/**
 * Get a facet by ID
 */
export async function getFacetById(id: number): Promise<Facet | undefined> {
  const results = await db.select().from(facets).where(eq(facets.id, id));
  return results[0];
}

/**
 * Get a facet by slug and type
 */
export async function getFacetBySlug(slug: string, type: string): Promise<Facet | undefined> {
  const results = await db
    .select()
    .from(facets)
    .where(and(eq(facets.slug, slug), eq(facets.type, type)));
  return results[0];
}

/**
 * Search facets by name, optionally filtered by type
 */
export async function searchFacets(query: string, type?: string): Promise<Facet[]> {
  const searchPattern = `%${query}%`;

  if (type) {
    return db
      .select()
      .from(facets)
      .where(and(
        like(facets.name, searchPattern),
        eq(facets.type, type)
      ))
      .limit(20);
  }

  return db
    .select()
    .from(facets)
    .where(like(facets.name, searchPattern))
    .limit(20);
}

/**
 * Create a new facet
 */
export async function createFacet(facet: NewFacet): Promise<Facet> {
  const results = await db.insert(facets).values(facet).returning();
  return results[0];
}

/**
 * Update a facet
 */
export async function updateFacet(
  id: number,
  updates: Partial<NewFacet>
): Promise<Facet | undefined> {
  const results = await db
    .update(facets)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(facets.id, id))
    .returning();
  return results[0];
}

/**
 * Delete a facet
 */
export async function deleteFacet(id: number): Promise<void> {
  await db.delete(facets).where(eq(facets.id, id));
}

/**
 * Add a facet to an artwork
 */
export async function addFacetToArtwork(
  artworkId: number,
  facetId: number
): Promise<void> {
  await db.insert(artworksToFacets).values({
    artworkId,
    facetId,
  });
}

/**
 * Remove a facet from an artwork
 */
export async function removeFacetFromArtwork(
  artworkId: number,
  facetId: number
): Promise<void> {
  await db
    .delete(artworksToFacets)
    .where(
      and(
        eq(artworksToFacets.artworkId, artworkId),
        eq(artworksToFacets.facetId, facetId)
      )
    );
}

/**
 * Get all facets for an artwork, optionally filtered by type
 */
export async function getFacetsForArtwork(
  artworkId: number,
  type?: string
): Promise<Facet[]> {
  const query = db
    .select({ facet: facets })
    .from(artworksToFacets)
    .innerJoin(facets, eq(artworksToFacets.facetId, facets.id))
    .where(eq(artworksToFacets.artworkId, artworkId));

  const results = await query;

  if (type) {
    return results
      .map(r => r.facet)
      .filter(f => f.type === type);
  }

  return results.map(r => r.facet);
}

/**
 * Set all facets for an artwork (replaces existing)
 * Optionally filter by type to only replace facets of that type
 */
export async function setFacetsForArtwork(
  artworkId: number,
  facetIds: number[],
  type?: string
): Promise<void> {
  // If type is specified, only delete facets of that type
  if (type) {
    // Get existing facet links for this artwork
    const existingLinks = await db
      .select({ facetId: artworksToFacets.facetId })
      .from(artworksToFacets)
      .innerJoin(facets, eq(artworksToFacets.facetId, facets.id))
      .where(
        and(
          eq(artworksToFacets.artworkId, artworkId),
          eq(facets.type, type)
        )
      );

    // Delete only facets of this type
    for (const link of existingLinks) {
      await db
        .delete(artworksToFacets)
        .where(
          and(
            eq(artworksToFacets.artworkId, artworkId),
            eq(artworksToFacets.facetId, link.facetId)
          )
        );
    }
  } else {
    // Delete all facet links for this artwork
    await db
      .delete(artworksToFacets)
      .where(eq(artworksToFacets.artworkId, artworkId));
  }

  // Add new facet links
  if (facetIds.length > 0) {
    await db.insert(artworksToFacets).values(
      facetIds.map(facetId => ({
        artworkId,
        facetId,
      }))
    );
  }
}

/**
 * Get artworks that have a specific facet
 */
export async function getArtworksByFacet(facetId: number): Promise<(typeof artworks.$inferSelect)[]> {
  const results = await db
    .select({ artwork: artworks })
    .from(artworksToFacets)
    .innerJoin(artworks, eq(artworksToFacets.artworkId, artworks.id))
    .where(eq(artworksToFacets.facetId, facetId));

  return results.map(r => r.artwork);
}
