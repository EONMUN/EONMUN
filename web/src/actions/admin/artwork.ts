'use server';

import { revalidatePath } from 'next/cache';
import * as artworkModel from '@/models/artworks';
import type { Artwork, NewArtwork } from '@/models/artworks';

export type { Artwork };

export async function getAllArtworksAdmin() {
  try {
    const artworks = await artworkModel.getAllArtworks();
    return { data: artworks };
  } catch (error) {
    console.error('Error fetching artworks:', error);
    throw error;
  }
}

export async function getArtworkByIdAdmin(id: number) {
  try {
    const artwork = await artworkModel.getArtworkById(id);
    return artwork;
  } catch (error) {
    console.error('Error fetching artwork:', error);
    throw error;
  }
}

export async function createArtworkAdmin(data: Omit<NewArtwork, 'createdAt' | 'updatedAt'>) {
  try {
    const artwork = await artworkModel.createArtwork(data);
    revalidatePath('/admin/artworks');
    return { success: true, data: artwork };
  } catch (error) {
    console.error('Error creating artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create artwork' };
  }
}

export async function updateArtworkAdmin(id: number, data: Partial<Omit<NewArtwork, 'createdAt' | 'updatedAt'>>) {
  try {
    const artwork = await artworkModel.updateArtwork(id, data);
    if (!artwork) {
      return { success: false, error: 'Artwork not found' };
    }
    revalidatePath('/admin/artworks');
    return { success: true, data: artwork };
  } catch (error) {
    console.error('Error updating artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update artwork' };
  }
}

export async function deleteArtworkAdmin(id: number) {
  try {
    await artworkModel.deleteArtwork(id);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete artwork' };
  }
}
