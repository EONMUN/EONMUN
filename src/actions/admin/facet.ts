'use server';

import { revalidatePath } from 'next/cache';
import * as facetModel from '@/models/facets';
import type { Facet, NewFacet } from '@/models/facets';
import { guardAuth, guardAdmin } from '@/lib/actions';

export type { Facet };

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and hyphens)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Get all facets, optionally filtered by type
 */
export async function getAllFacetsAdmin(type?: string) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const facets = await facetModel.getAllFacets(type);
    return { data: facets };
  } catch (error) {
    console.error('Error fetching facets:', error);
    return { data: [] };
  }
}

/**
 * Get a facet by ID
 */
export async function getFacetByIdAdmin(id: number) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const facet = await facetModel.getFacetById(id);
    return facet;
  } catch (error) {
    console.error('Error fetching facet:', error);
    return null;
  }
}

/**
 * Search facets by name, optionally filtered by type
 */
export async function searchFacetsAdmin(query: string, type?: string) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const facets = await facetModel.searchFacets(query, type);
    return { data: facets };
  } catch (error) {
    console.error('Error searching facets:', error);
    return { data: [] };
  }
}

/**
 * Create a new facet
 */
export async function createFacetAdmin(data: Omit<NewFacet, 'createdAt' | 'updatedAt'>) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const facet = await facetModel.createFacet({
      ...data,
      slug: data.slug || generateSlug(data.name),
    });
    revalidatePath('/admin/artworks');
    return { success: true, data: facet };
  } catch (error) {
    console.error('Error creating facet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create facet' };
  }
}

/**
 * Create a facet inline (from artwork form) - simplified version
 */
export async function createFacetInlineAdmin(name: string, type: string) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const slug = generateSlug(name);

    // Check if facet already exists
    const existing = await facetModel.getFacetBySlug(slug, type);
    if (existing) {
      return { success: true, data: existing };
    }

    const facet = await facetModel.createFacet({
      name,
      slug,
      type,
    });
    return { success: true, data: facet };
  } catch (error) {
    console.error('Error creating facet inline:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create facet' };
  }
}

/**
 * Update a facet
 */
export async function updateFacetAdmin(id: number, data: Partial<Omit<NewFacet, 'createdAt' | 'updatedAt'>>) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const facet = await facetModel.updateFacet(id, data);
    if (!facet) {
      return { success: false, error: 'Facet not found' };
    }
    revalidatePath('/admin/artworks');
    return { success: true, data: facet };
  } catch (error) {
    console.error('Error updating facet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update facet' };
  }
}

/**
 * Delete a facet
 */
export async function deleteFacetAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await facetModel.deleteFacet(id);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error deleting facet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete facet' };
  }
}

/**
 * Get all facets for an artwork, optionally filtered by type
 */
export async function getFacetsForArtworkAdmin(artworkId: number, type?: string) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const facets = await facetModel.getFacetsForArtwork(artworkId, type);
    return { data: facets };
  } catch (error) {
    console.error('Error fetching artwork facets:', error);
    return { data: [] };
  }
}

/**
 * Set all facets for an artwork (replaces existing)
 */
export async function setFacetsForArtworkAdmin(artworkId: number, facetIds: number[], type?: string) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await facetModel.setFacetsForArtwork(artworkId, facetIds, type);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error setting artwork facets:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to set facets' };
  }
}

/**
 * Add a single facet to an artwork
 */
export async function addFacetToArtworkAdmin(artworkId: number, facetId: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await facetModel.addFacetToArtwork(artworkId, facetId);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error adding facet to artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to add facet' };
  }
}

/**
 * Remove a facet from an artwork
 */
export async function removeFacetFromArtworkAdmin(artworkId: number, facetId: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await facetModel.removeFacetFromArtwork(artworkId, facetId);
    revalidatePath('/admin/artworks');
    return { success: true };
  } catch (error) {
    console.error('Error removing facet from artwork:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to remove facet' };
  }
}
