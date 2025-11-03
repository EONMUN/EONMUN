'use server';

import { collectionAPI, Collection, QueryParams, CreateCollectionData, UpdateCollectionData } from '@/lib/strapi';
import { revalidatePath } from 'next/cache';

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const collection = await collectionAPI.getBySlug(slug);
  return collection as Collection | null;
}

export async function getAllCollections(params?: QueryParams) {
  const response = await collectionAPI.getAll(params);
  return response;
}

export async function getCollectionById(documentId: string) {
  const collection = await collectionAPI.getById(documentId);
  return collection as unknown as Collection;
}

export async function createCollection(data: CreateCollectionData) {
  try {
    const response = await collectionAPI.create(data);
    revalidatePath('/collections');
    revalidatePath('/admin/collections');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create collection' };
  }
}

export async function updateCollection(documentId: string, data: UpdateCollectionData) {
  try {
    const response = await collectionAPI.update(documentId, data);
    revalidatePath('/collections');
    revalidatePath(`/collections/${response.data.slug}`);
    revalidatePath('/admin/collections');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update collection' };
  }
}

export async function deleteCollection(documentId: string) {
  try {
    await collectionAPI.delete(documentId);
    revalidatePath('/collections');
    revalidatePath('/admin/collections');
    return { success: true };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete collection' };
  }
}
