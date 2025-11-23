import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, collections, artworks } from '@/database';
import { collectionFactory } from '@/database/factories/collection.factory';
import { artworkFactory } from '@/database/factories/artwork.factory';
import { findCollections, findCollectionsWithArtworks } from '@/models/collection';

describe('Collection Model Integration Tests', () => {
  beforeEach(async () => {
    // Clear all tables before each test to ensure isolation
    await db.delete(artworks);
    await db.delete(collections);
  });

  describe('Collection Factory', () => {
    it('should create collection with default values', async () => {
      const collection = await collectionFactory.create();

      expect(collection).toBeDefined();
      expect(collection.id).toBeGreaterThan(0);
      expect(collection.name).toBeDefined();
      expect(collection.slug).toBeDefined();
      expect(collection.locale).toBe('en');
      expect(collection.publishedAt).toBeNull(); // Default is draft
      expect(collection.createdAt).toBeInstanceOf(Date);
      expect(collection.updatedAt).toBeInstanceOf(Date);
    });

    it('should create published collection using trait', async () => {
      const collection = await collectionFactory.published().create();

      expect(collection.publishedAt).toBeInstanceOf(Date);
    });

    it('should create draft collection using trait', async () => {
      const collection = await collectionFactory.draft().create();

      expect(collection.publishedAt).toBeNull();
    });

    it('should create multiple collections', async () => {
      const collections = await collectionFactory.createList(5);

      expect(collections).toHaveLength(5);
      collections.forEach((collection) => {
        expect(collection.id).toBeGreaterThan(0);
        expect(collection.slug).toBeDefined();
      });
    });
  });

  describe('findCollections - Filtering', () => {
    it('should return all collections when no filters provided', async () => {
      await collectionFactory.createList(3);

      const result = await findCollections({});

      expect(result).toHaveLength(3);
    });

    it('should filter collections by slug', async () => {
      await collectionFactory.create({ slug: 'modern-art' });
      await collectionFactory.create({ slug: 'classic-art' });

      const result = await findCollections({ slug: ['modern-art'] });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('modern-art');
    });

    it('should filter collections by multiple slugs', async () => {
      await collectionFactory.create({ slug: 'collection-1' });
      await collectionFactory.create({ slug: 'collection-2' });
      await collectionFactory.create({ slug: 'collection-3' });

      const result = await findCollections({ slug: ['collection-1', 'collection-3'] });

      expect(result).toHaveLength(2);
      expect(result.map((c) => c.slug)).toContain('collection-1');
      expect(result.map((c) => c.slug)).toContain('collection-3');
    });

    it('should filter collections by published status (published)', async () => {
      await collectionFactory.published().create();
      await collectionFactory.published().create();
      await collectionFactory.draft().create();

      const result = await findCollections({ published: true });

      expect(result).toHaveLength(2);
      result.forEach((collection) => {
        expect(collection.publishedAt).toBeInstanceOf(Date);
      });
    });

    it('should filter collections by published status (drafts)', async () => {
      await collectionFactory.published().create();
      await collectionFactory.draft().create();
      await collectionFactory.draft().create();

      const result = await findCollections({ published: false });

      expect(result).toHaveLength(2);
      result.forEach((collection) => {
        expect(collection.publishedAt).toBeNull();
      });
    });

    it('should filter collections by locale', async () => {
      await collectionFactory.create({ locale: 'en' });
      await collectionFactory.create({ locale: 'en' });
      await collectionFactory.create({ locale: 'fr' });

      const result = await findCollections({ locale: ['en'] });

      expect(result).toHaveLength(2);
      result.forEach((collection) => {
        expect(collection.locale).toBe('en');
      });
    });
  });

  describe('Collection CRUD Operations', () => {
    it('should create a collection', async () => {
      const created = await collectionFactory.create({
        name: 'Modern Art Collection',
        description: 'A collection of contemporary artworks',
      });

      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe('Modern Art Collection');
      expect(created.description).toBe('A collection of contemporary artworks');
    });

    it('should update a collection', async () => {
      const created = await collectionFactory.create({ name: 'Original Name' });

      const updated = await db
        .update(collections)
        .set({ name: 'Updated Name' })
        .where(eq(collections.id, created.id))
        .returning();

      expect(updated[0]?.name).toBe('Updated Name');
    });

    it('should delete a collection', async () => {
      const created = await collectionFactory.create();

      await db
        .delete(collections)
        .where(eq(collections.id, created.id));

      const result = await findCollections({ id: [created.id] });
      expect(result).toHaveLength(0);
    });
  });

  describe('findCollectionsWithArtworks - Relationships', () => {
    it('should return collection with empty artworks array when no artworks linked', async () => {
      await collectionFactory.create({ slug: 'empty-collection' });

      const result = await findCollectionsWithArtworks({ slug: ['empty-collection'] });

      expect(result).toHaveLength(1);
      expect(result[0].artworks).toEqual([]);
    });

    it('should return collection with artworks when linked', async () => {
      const collection = await collectionFactory.create({ name: 'Art Gallery' });

      await artworkFactory.withCollection(collection.id).create({
        title: 'Starry Night',
        artist: 'Vincent van Gogh',
      });

      await artworkFactory.withCollection(collection.id).create({
        title: 'Mona Lisa',
        artist: 'Leonardo da Vinci',
      });

      const result = await findCollectionsWithArtworks({ id: [collection.id] });

      expect(result).toHaveLength(1);
      expect(result[0].artworks).toHaveLength(2);
      expect(result[0].artworks[0].title).toBe('Starry Night');
      expect(result[0].artworks[1].title).toBe('Mona Lisa');
    });

    it('should filter collections with artworks by slug', async () => {
      const collection1 = await collectionFactory.create({ slug: 'impressionist' });
      const collection2 = await collectionFactory.create({ slug: 'modern' });

      await artworkFactory.withCollection(collection1.id).create({ title: 'Water Lilies' });
      await artworkFactory.withCollection(collection2.id).create({ title: 'Abstract Art' });

      const result = await findCollectionsWithArtworks({ slug: ['impressionist'] });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('impressionist');
      expect(result[0].artworks).toHaveLength(1);
      expect(result[0].artworks[0].title).toBe('Water Lilies');
    });

    it('should return multiple collections with their artworks', async () => {
      const collection1 = await collectionFactory.create({ name: 'Collection 1' });
      const collection2 = await collectionFactory.create({ name: 'Collection 2' });

      await artworkFactory.withCollection(collection1.id).createList(2);
      await artworkFactory.withCollection(collection2.id).createList(3);

      const result = await findCollectionsWithArtworks({});

      expect(result).toHaveLength(2);
      expect(result.find((c) => c.id === collection1.id)?.artworks).toHaveLength(2);
      expect(result.find((c) => c.id === collection2.id)?.artworks).toHaveLength(3);
    });
  });
});
