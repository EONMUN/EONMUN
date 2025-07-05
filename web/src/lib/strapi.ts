import { strapi } from '@strapi/client';

// Initialize Strapi client
export const strapiClient = strapi({
  baseURL: process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337/api',
  auth: process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '',
});

// Artwork interface based on the Strapi schema
export interface Artwork {
  id: string;
  documentId: string;
  title: string;
  slug: string;
  description?: string;
  year?: number;
  default_image?: {
    id: string;
    name: string;
    url: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: any;
  };
  images?: {
    id: string;
    name: string;
    url: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: any;
  }[];
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
  images?: any[];
}

// Update artwork data interface
export interface UpdateArtworkData {
  title?: string;
  description?: string;
  year?: number;
  images?: any[];
}

// API functions for artwork CRUD operations
export const artworkAPI = {
  // Get all artworks
  async getAll(params?: any) {
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