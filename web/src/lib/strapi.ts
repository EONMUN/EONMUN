import { strapi } from '@strapi/client';

// Initialize Strapi client
export const strapiClient = strapi({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api',
  auth: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '',
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
        populate: ['images'],
      });
      return response?.data?.[0] || null;
    } catch (error) {
      console.error('Error fetching artwork by slug:', error);
      throw error;
    }
  },
};

// Collection interface based on the Strapi schema
export interface Collection {
  id: string;
  documentId: string;
  name: string;
  slug: string;
  artworks?: Artwork[];
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