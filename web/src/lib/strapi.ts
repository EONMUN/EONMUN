/**
 * Strapi API Client Library
 *
 * IMPORTANT: This library should ONLY be used in server-side code (Server Actions).
 *
 * ⚠️ DO NOT import this directly in:
 * - Client Components
 * - Pages (use Server Actions instead)
 * - Any code that runs in the browser
 *
 * ✅ Correct usage:
 * - Import this in /actions/*.ts files only
 * - Use the exported Server Actions from /actions in your pages/components
 *
 * Why?
 * - Keeps API tokens and secrets secure on the server
 * - Prevents exposing Strapi backend directly to clients
 * - Centralizes data fetching logic in one place
 *
 * Example:
 * ```typescript
 * // ❌ WRONG - Don't do this in a page or client component
 * import { productAPI } from '@/lib/strapi';
 *
 * // ✅ CORRECT - Use server actions instead
 * import { getProductBySlug } from '@/actions/product';
 * ```
 */

import { strapi } from '@strapi/client';

const baseURL = (process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337') + '/api';
const isLocalDevelopment = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
const apiToken = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

// Only use auth token if not in local development AND we have a valid token
const authConfig = { auth: apiToken };

console.log({
  baseURL,
  isLocalDevelopment,
  hasAuth: !isLocalDevelopment && !!apiToken,
})

// Initialize Strapi client
export const strapiClient = strapi({
  baseURL,
  ...authConfig,
});

// Image format interface for different sizes
export interface ImageFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path?: string;
  width: number;
  height: number;
  size: number;
  url: string;
}

// Image formats collection interface
export interface ImageFormats {
  thumbnail?: ImageFormat;
  small?: ImageFormat;
  medium?: ImageFormat;
  large?: ImageFormat;
}

// Strapi image interface
export interface StrapiImage {
  id: string;
  name: string;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  formats?: ImageFormats;
}

// Upload file interface for creating/updating
export interface UploadFileInput {
  id?: string;
  name?: string;
  alternativeText?: string;
  caption?: string;
}

// Query parameters interface
export interface QueryParams {
  populate?: string[] | Record<string, unknown>;
  filters?: Record<string, unknown>;
  sort?: string | string[];
  pagination?: {
    page?: number;
    pageSize?: number;
    start?: number;
    limit?: number;
  };
  fields?: string[];
  locale?: string;
  publicationState?: 'live' | 'preview';
}

// Artwork interface based on the Strapi schema
export interface Artwork {
  id: string;
  documentId: string;
  title: string;
  slug: string;
  description?: string;
  year?: number;
  default_image?: StrapiImage;
  images?: StrapiImage[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
  collections?: Collection[];
}

// Create artwork data interface
export interface CreateArtworkData {
  title: string;
  description?: string;
  year?: number;
  images?: UploadFileInput[];
}

// Update artwork data interface
export interface UpdateArtworkData {
  title?: string;
  description?: string;
  year?: number;
  images?: UploadFileInput[];
}

// API functions for artwork CRUD operations
export const artworkAPI = {
  // Get all artworks
  async getAll(params?: QueryParams) {
    try {
      const response = await strapiClient.collection('artworks').find({
        populate: ['images'],
        ...params,
      });
      return {
        data: response.data as Artwork[],
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error fetching artworks:', error);
      throw error;
    }
  },

  // Get single artwork by documentId
  async getById(documentId: string) {
    try {
      const response = await strapiClient.collection('artworks').findOne(documentId, {
        populate: ['images'],
      });
      return response;
    } catch (error) {
      console.error('Error fetching artwork:', error);
      throw error;
    }
  },

  // Create new artwork
  async create(data: CreateArtworkData) {
    try {
      const response = await strapiClient.collection('artworks').create({
        data,
        populate: ['images'],
      });
      return {
        data: response.data as Artwork,
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error creating artwork:', error);
      throw error;
    }
  },

  // Update artwork
  async update(documentId: string, data: UpdateArtworkData) {
    try {
      const response = await strapiClient.collection('artworks').update(documentId, {
        data,
        populate: ['images'],
      });
      return {
        data: response.data as Artwork,
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error updating artwork:', error);
      throw error;
    }
  },

  // Delete artwork
  async delete(documentId: string) {
    try {
      const response = await strapiClient.collection('artworks').delete(documentId);
      return response;
    } catch (error) {
      console.error('Error deleting artwork:', error);
      throw error;
    }
  },

  // Get artwork by slug
  async getBySlug(slug: string) {
    try {
      const response = await strapiClient.collection('artworks').find({
        filters: {
          slug: {
            $eq: slug,
          },
        },
        populate: ['default_image', 'images', 'collections'],
      });
      return response?.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching artwork by slug:', error);
      throw error;
    }
  },
};

// Collection interface based on the Strapi schema
// Product interface based on the Strapi schema
export interface Product {
  id: string;
  documentId: string;
  title: string;
  description?: string;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP';
  slug: string;
  images?: StrapiImage[];
  artwork?: Artwork;
  product_type: 'artwork' | 'print' | 'merchandise' | 'digital' | 'book' | 'other';
  is_digital: boolean;
  is_available: boolean;
  stock_quantity: number;
  stripe_product_id?: string;
  sku?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shipping_required: boolean;
  featured: boolean;
  collections?: Collection[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
}

export interface Collection {
  id: string;
  documentId: string;
  name: string;
  slug: string;
  artworks?: Artwork[];
  products?: Product[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
}

// Create collection data interface
export interface CreateCollectionData {
  name: string;
  artworks?: string[]; // Array of artwork documentIds
}

// Update collection data interface
export interface UpdateCollectionData {
  name?: string;
  artworks?: string[]; // Array of artwork documentIds
}

// API functions for collection CRUD operations
export const collectionAPI = {
  // Get all collections
  async getAll(params?: QueryParams) {
    try {
      const response = await strapiClient.collection('collections').find({
        populate: ['artworks', 'artworks.default_image'],
        ...params,
      });
      return {
        data: response.data as Collection[],
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  },

  // Get single collection by documentId
  async getById(documentId: string) {
    try {
      const response = await strapiClient.collection('collections').findOne(documentId, {
        populate: ['artworks', 'artworks.default_image'],
      });
      return response;
    } catch (error) {
      console.error('Error fetching collection:', error);
      throw error;
    }
  },

  // Create new collection
  async create(data: CreateCollectionData) {
    try {
      const response = await strapiClient.collection('collections').create({
        data,
        populate: ['artworks', 'artworks.default_image'],
      });
      return {
        data: response.data as Collection,
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  },

  // Update collection
  async update(documentId: string, data: UpdateCollectionData) {
    try {
      const response = await strapiClient.collection('collections').update(documentId, {
        data,
        populate: ['artworks', 'artworks.default_image'],
      });
      return {
        data: response.data as Collection,
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  },

  // Delete collection
  async delete(documentId: string) {
    try {
      const response = await strapiClient.collection('collections').delete(documentId);
      return response;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  },

  // Get collection by slug
  async getBySlug(slug: string) {
    try {
      const response = await strapiClient.collection('collections').find({
        filters: {
          slug: {
            $eq: slug,
          },
        },
        populate: ['artworks', 'artworks.default_image'],
      });
      return response?.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching collection by slug:', error);
      throw error;
    }
  },
};

// Create product data interface
export interface CreateProductData {
  title: string;
  description?: string;
  price: number;
  currency?: 'USD' | 'EUR' | 'GBP';
  product_type?: 'artwork' | 'print' | 'merchandise' | 'digital' | 'book' | 'other';
  is_digital?: boolean;
  is_available?: boolean;
  stock_quantity?: number;
  sku?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shipping_required?: boolean;
  featured?: boolean;
  artwork?: string; // Artwork documentId
  images?: UploadFileInput[];
  collections?: string[]; // Array of collection documentIds
}

// Update product data interface
export interface UpdateProductData {
  title?: string;
  description?: string;
  price?: number;
  currency?: 'USD' | 'EUR' | 'GBP';
  product_type?: 'artwork' | 'print' | 'merchandise' | 'digital' | 'book' | 'other';
  is_digital?: boolean;
  is_available?: boolean;
  stock_quantity?: number;
  sku?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  shipping_required?: boolean;
  featured?: boolean;
  artwork?: string; // Artwork documentId
  images?: UploadFileInput[];
  collections?: string[]; // Array of collection documentIds
}

// API functions for product CRUD operations
export const productAPI = {
  // Get all products
  async getAll(params?: QueryParams) {
    try {
      const response = await strapiClient.collection('products').find({
        populate: {
          images: true,
          artwork: {
            populate: ['default_image']
          }
        },
        ...params,
      });
      return {
        data: response.data as Product[],
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get single product by documentId
  async getById(documentId: string) {
    try {
      const response = await strapiClient.collection('products').findOne(documentId, {
        populate: {
          images: true,
          artwork: {
            populate: ['default_image']
          }
        },
      });
      return response;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Create new product
  async create(data: CreateProductData) {
    try {
      const response = await strapiClient.collection('products').create({
        data,
        populate: {
          images: true,
          artwork: {
            populate: ['default_image']
          }
        },
      });
      return {
        data: response.data as Product,
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  async update(documentId: string, data: UpdateProductData) {
    try {
      const response = await strapiClient.collection('products').update(documentId, {
        data,
        populate: {
          images: true,
          artwork: {
            populate: ['default_image']
          }
        },
      });
      return {
        data: response.data as Product,
        meta: response.meta,
      };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  async delete(documentId: string) {
    try {
      const response = await strapiClient.collection('products').delete(documentId);
      return response;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Get product by slug
  async getBySlug(slug: string) {
    try {
      const response = await strapiClient.collection('products').find({
        filters: {
          slug: {
            $eq: slug,
          },
        },
        populate: {
          images: true,
          artwork: {
            populate: ['default_image']
          }
        },
      });
      return (response?.data?.[0] as Product) || null;
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      throw error;
    }
  },
};

// Dynamic zone block interface
export interface DynamicZoneBlock {
  __component: string;
  id: number;
  // Media component fields
  file?: StrapiImage;
  files?: StrapiImage[];
  // Quote component fields
  title?: string;
  body?: string;
}

// About interface based on the Strapi schema
export interface About {
  id: string;
  documentId: string;
  title: string;
  blocks?: DynamicZoneBlock[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  locale: string;
}

// API functions for about operations
export const aboutAPI = {
  // Get about content (single type)
  async get() {
    try {
      const response = await strapiClient.single('about').find({
        populate: "*",
      });
      return response.data as About;
    } catch (error) {
      console.error('Error fetching about content:', error);
      throw error;
    }
  },
};
