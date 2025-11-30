'use server';

import { revalidatePath } from 'next/cache';
import * as collectionModel from '@/models/collections';
import * as artworkModel from '@/models/artworks';
import type { Collection, NewCollection } from '@/models/collections';
import { guardAuth, guardAdmin } from '@/lib/actions';

export type { Collection };

export async function getAllCollectionsAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const collections = await collectionModel.getAllCollectionsWithDefaultArtwork();
    return { data: collections };
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
}

export async function getCollectionByIdAdmin(id: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const collection = await collectionModel.getCollectionById(id);
    return collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
}

export async function getCollectionBySlugAdmin(slug: string) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const collection = await collectionModel.getCollectionBySlug(slug);
    return collection;
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
}

export async function getCollectionWithArtworksBySlugAdmin(slug: string) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const collection = await collectionModel.getCollectionWithArtworksBySlug(slug);
    return collection;
  } catch (error) {
    console.error('Error fetching collection with artworks:', error);
    throw error;
  }
}

// TODO: Update for many-to-many relationship
// export async function getCollectionWithArtworksAdmin(id: number) {
//   const authError = await guardAuth();
//   if (authError) return null;
//
//   try {
//     const collection = await collectionModel.getCollectionWithArtworks(id);
//     return collection;
//   } catch (error) {
//     console.error('Error fetching collection with artworks:', error);
//     throw error;
//   }
// }

export async function createCollectionAdmin(data: Omit<NewCollection, 'createdAt' | 'updatedAt'>) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const collection = await collectionModel.createCollection(data);
    revalidatePath('/admin/collections');
    return { success: true, data: collection };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create collection' };
  }
}

export async function updateCollectionAdmin(id: number, data: Partial<Omit<NewCollection, 'createdAt' | 'updatedAt'>>) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const collection = await collectionModel.updateCollection(id, data);
    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }
    revalidatePath('/admin/collections');
    return { success: true, data: collection };
  } catch (error) {
    console.error('Error updating collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update collection' };
  }
}

export async function deleteCollectionAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await collectionModel.deleteCollection(id);
    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete collection' };
  }
}

export async function addArtworkToCollectionAdmin(
  collectionId: number,
  artworkId: number,
  isDefault: boolean = false
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await collectionModel.addArtworkToCollection(collectionId, artworkId, isDefault);
    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Error adding artwork to collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add artwork to collection' };
  }
}

export async function removeArtworkFromCollectionAdmin(
  collectionId: number,
  artworkId: number
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await collectionModel.removeArtworkFromCollection(collectionId, artworkId);
    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Error removing artwork from collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove artwork from collection' };
  }
}

export async function setDefaultArtworkAdmin(
  collectionId: number,
  artworkId: number
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await collectionModel.setDefaultArtwork(collectionId, artworkId);
    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Error setting default artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to set default artwork' };
  }
}

export async function searchArtworksAdmin(query: string) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const artworks = await artworkModel.searchArtworks(query);
    return { data: artworks };
  } catch (error) {
    console.error('Error searching artworks:', error);
    return { data: [] };
  }
}

/**
 * Search collections by name
 */
export async function searchCollectionsAdmin(query: string) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const collections = await collectionModel.searchCollections(query);
    return { data: collections };
  } catch (error) {
    console.error('Error searching collections:', error);
    return { data: [] };
  }
}

/**
 * Get all collections for an artwork with their default status
 */
export async function getCollectionsForArtworkAdmin(artworkId: number) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const collections = await collectionModel.getCollectionsForArtwork(artworkId);
    return { data: collections };
  } catch (error) {
    console.error('Error fetching artwork collections:', error);
    return { data: [] };
  }
}

/**
 * Set all collections for an artwork (replaces existing)
 */
export async function setCollectionsForArtworkAdmin(
  artworkId: number,
  collectionData: { collectionId: number; isDefault: boolean }[]
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await collectionModel.setCollectionsForArtwork(artworkId, collectionData);
    revalidatePath('/admin/artworks');
    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Error setting artwork collections:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to set collections' };
  }
}
