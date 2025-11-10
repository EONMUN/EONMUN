'use server';

import { revalidatePath } from 'next/cache';
import * as uploadModel from '@/models/uploads';
import type { Upload, NewUpload, ArtworkUpload } from '@/models/uploads';
import { guardAuth, guardAdmin } from '@/lib/actions';

export type { Upload, ArtworkUpload };

/**
 * Get all uploads for a specific artwork
 */
export async function getArtworkUploadsAdmin(artworkId: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const result = await uploadModel.getUploadsByArtworkId(artworkId);
    return result;
  } catch (error) {
    console.error('Error fetching artwork uploads:', error);
    throw error;
  }
}

/**
 * Get a single upload by ID
 */
export async function getUploadByIdAdmin(id: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const upload = await uploadModel.getUploadById(id);
    return upload;
  } catch (error) {
    console.error('Error fetching upload:', error);
    throw error;
  }
}

/**
 * Create a new upload and link it to an artwork
 */
export async function createUploadForArtworkAdmin(
  uploadData: Omit<NewUpload, 'createdAt' | 'updatedAt'>,
  artworkId: number,
  isDefault = false
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const result = await uploadModel.createUploadForArtwork(uploadData, artworkId, isDefault);
    revalidatePath(`/admin/artworks/${artworkId}`);
    revalidatePath('/admin/artworks');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating upload for artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create upload' };
  }
}

/**
 * Link an existing upload to an artwork
 */
export async function linkUploadToArtworkAdmin(
  uploadId: number,
  artworkId: number,
  isDefault = false
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const result = await uploadModel.linkUploadToArtwork(uploadId, artworkId, isDefault);
    revalidatePath(`/admin/artworks/${artworkId}`);
    revalidatePath('/admin/artworks');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error linking upload to artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to link upload' };
  }
}

/**
 * Set an upload as the default for an artwork
 */
export async function setUploadAsDefaultAdmin(uploadId: number, artworkId: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const result = await uploadModel.setUploadAsDefaultForArtwork(uploadId, artworkId);
    if (!result) {
      return { success: false, error: 'Upload or artwork relationship not found' };
    }
    revalidatePath(`/admin/artworks/${artworkId}`);
    revalidatePath('/admin/artworks');
    return { success: true, data: result };
  } catch (error) {
    console.error('Error setting default upload:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to set default upload' };
  }
}

/**
 * Unlink an upload from an artwork
 */
export async function unlinkUploadFromArtworkAdmin(uploadId: number, artworkId: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await uploadModel.unlinkUploadFromArtwork(uploadId, artworkId);
    revalidatePath(`/admin/artworks/${artworkId}`);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error unlinking upload from artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to unlink upload' };
  }
}

/**
 * Update upload metadata
 */
export async function updateUploadAdmin(
  id: number,
  updates: Partial<Omit<NewUpload, 'createdAt' | 'updatedAt'>>
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const upload = await uploadModel.updateUpload(id, updates);
    if (!upload) {
      return { success: false, error: 'Upload not found' };
    }
    revalidatePath('/admin/artworks');
    return { success: true, data: upload };
  } catch (error) {
    console.error('Error updating upload:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update upload' };
  }
}

/**
 * Soft delete an upload (marks as deleted)
 */
export async function softDeleteUploadAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await uploadModel.softDeleteUpload(id);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error soft deleting upload:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete upload' };
  }
}

/**
 * Permanently delete an upload
 */
export async function deleteUploadAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await uploadModel.deleteUpload(id);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting upload:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete upload' };
  }
}

/**
 * Get upload statistics for an artwork
 */
export async function getArtworkUploadStatsAdmin(artworkId: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const stats = await uploadModel.getArtworkUploadStats(artworkId);
    return stats;
  } catch (error) {
    console.error('Error fetching upload stats:', error);
    throw error;
  }
}
