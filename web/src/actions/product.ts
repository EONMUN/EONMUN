'use server';

import { productAPI, Product, QueryParams } from '@/lib/strapi';

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const product = await productAPI.getBySlug(slug);
  return product;
}

export async function getAllProducts(params?: QueryParams) {
  const response = await productAPI.getAll(params);
  return response;
}
