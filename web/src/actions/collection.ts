'use server';

import { collectionAPI, Collection, QueryParams } from '@/lib/strapi';

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const collection = await collectionAPI.getBySlug(slug);
  return collection;
}

export async function getAllCollections(params?: QueryParams) {
  const response = await collectionAPI.getAll(params);
  return response;
}

export async function getCollectionById(documentId: string) {
  const collection = await collectionAPI.getById(documentId);
  return collection;
}
