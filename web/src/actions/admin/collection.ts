'use server';

import { revalidatePath } from 'next/cache';
import * as collectionModel from '@/models/collections';
import type { Collection, NewCollection } from '@/models/collections';
import { guardAuth, guardAdmin } from '@/lib/actions';

export type { Collection };

export async function getAllCollectionsAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const collections = await collectionModel.getAllCollections();
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

export async function getCollectionWithArtworksAdmin(id: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const collection = await collectionModel.getCollectionWithArtworks(id);
    return collection;
  } catch (error) {
    console.error('Error fetching collection with artworks:', error);
    throw error;
  }
}

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
