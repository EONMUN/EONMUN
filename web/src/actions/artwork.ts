'use server';

import { artworkAPI, Artwork, QueryParams } from '@/lib/strapi';

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
