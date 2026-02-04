/**
 * Homepage artworks model functions for querying homepage artworks from the database.
 */

import { asc, eq, and, inArray } from "drizzle-orm";
import {
  db,
  homepageArtworks,
  artworks,
  artworkImages,
  collections,
  artworksToCollections,
  type SelectHomepageArtwork,
} from "@/database";
import type { ArtworkWithCollections } from "@/models/artwork";

/**
 * Get all homepage artworks ordered by position
 */
export async function getHomepageArtworks(): Promise<ArtworkWithCollections[]> {
  // Get homepage artwork IDs ordered by position
  const homepageArtworksList = await db
    .select()
    .from(homepageArtworks)
    .orderBy(asc(homepageArtworks.position));

  if (homepageArtworksList.length === 0) {
    return [];
  }

  const artworkIds = homepageArtworksList.map((ha) => ha.artworkId);

  // Fetch artworks with default images
  const artworksList = await db
    .select({
      id: artworks.id,
      title: artworks.title,
      slug: artworks.slug,
      description: artworks.description,
      artist: artworks.artist,
      year: artworks.year,
      width: artworks.width,
      height: artworks.height,
      depth: artworks.depth,
      dimensionUnit: artworks.dimensionUnit,
      publishedAt: artworks.publishedAt,
      locale: artworks.locale,
      createdAt: artworks.createdAt,
      updatedAt: artworks.updatedAt,
      defaultImageUrl: artworkImages.url,
    })
    .from(artworks)
    .leftJoin(
      artworkImages,
      and(
        eq(artworks.id, artworkImages.artworkId),
        eq(artworkImages.isDefault, true)
      ),
    )
    .where(inArray(artworks.id, artworkIds));

  // Fetch collections for these artworks
  const collectionData = await db
    .select({
      artworkId: artworksToCollections.artworkId,
      collection: collections,
    })
    .from(artworksToCollections)
    .innerJoin(
      collections,
      eq(artworksToCollections.collectionId, collections.id),
    )
    .where(inArray(artworksToCollections.artworkId, artworkIds));

  // Fetch all images for these artworks
  const imagesData = await db
    .select()
    .from(artworkImages)
    .where(inArray(artworkImages.artworkId, artworkIds));

  // Group collections by artwork ID
  const collectionsByArtworkId = new Map<number, typeof collections.$inferSelect[]>();
  for (const row of collectionData) {
    const existing = collectionsByArtworkId.get(row.artworkId) || [];
    existing.push(row.collection);
    collectionsByArtworkId.set(row.artworkId, existing);
  }

  // Group images by artwork ID
  const imagesByArtworkId = new Map<
    number,
    { url: string; isDefault: boolean; caption: string | null }[]
  >();
  for (const img of imagesData) {
    const existing = imagesByArtworkId.get(img.artworkId) || [];
    existing.push({
      url: img.url,
      isDefault: img.isDefault ?? false,
      caption: img.caption,
    });
    imagesByArtworkId.set(img.artworkId, existing);
  }

  // Combine data and maintain order from homepageArtworksList
  const result: ArtworkWithCollections[] = [];
  for (const ha of homepageArtworksList) {
    const artwork = artworksList.find((a) => a.id === ha.artworkId);
    if (artwork) {
      result.push({
        ...artwork,
        collections: collectionsByArtworkId.get(artwork.id) || [],
        images: imagesByArtworkId.get(artwork.id) || [],
      });
    }
  }

  return result;
}

/**
 * Add an artwork to the homepage at a specific position
 */
export async function addHomepageArtwork(
  artworkId: number,
  position: number,
): Promise<SelectHomepageArtwork> {
  const [result] = await db
    .insert(homepageArtworks)
    .values({
      artworkId,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return result;
}

/**
 * Remove an artwork from the homepage
 */
export async function removeHomepageArtwork(artworkId: number): Promise<void> {
  await db
    .delete(homepageArtworks)
    .where(eq(homepageArtworks.artworkId, artworkId));
}

/**
 * Update positions of homepage artworks
 */
export async function updateHomepageArtworkPositions(
  artworkIds: number[],
): Promise<void> {
  // Delete all existing homepage artworks
  await db.delete(homepageArtworks);

  // Insert new positions
  const values = artworkIds.map((artworkId, index) => ({
    artworkId,
    position: index,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  if (values.length > 0) {
    await db.insert(homepageArtworks).values(values);
  }
}
