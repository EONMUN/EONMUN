'use server';

import { artworkAPI, Artwork, QueryParams, CreateArtworkData, UpdateArtworkData } from '@/lib/strapi';
import { revalidatePath } from 'next/cache';

export async function getArtworkBySlug(slug: string): Promise<Artwork | null> {
  const artwork = await artworkAPI.getBySlug(slug);
  return artwork as Artwork | null;
}

export async function getAllArtworks(params?: QueryParams) {
  const response = await artworkAPI.getAll(params);
  return response;
}

export async function getArtworkById(documentId: string) {
  const artwork = await artworkAPI.getById(documentId);
  return artwork as unknown as Artwork;
}

export async function createArtwork(data: CreateArtworkData) {
  try {
    const response = await artworkAPI.create(data);
    revalidatePath('/artworks');
    revalidatePath('/admin/artworks');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create artwork' };
  }
}

export async function updateArtwork(documentId: string, data: UpdateArtworkData) {
  try {
    const response = await artworkAPI.update(documentId, data);
    revalidatePath('/artworks');
    revalidatePath(`/artworks/${response.data.slug}`);
    revalidatePath('/admin/artworks');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update artwork' };
  }
}

export async function deleteArtwork(documentId: string) {
  try {
    await artworkAPI.delete(documentId);
    revalidatePath('/artworks');
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete artwork' };
  }
}
