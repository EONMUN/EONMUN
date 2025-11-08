import { describe, it, expect, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, artworks, collections } from '@/lib/db';
import { artworkFactory } from '@/database/factories/artwork.factory';
import { collectionFactory } from '@/database/factories/collection.factory';
import { findArtworks, findArtworksWithCollections } from '@/models/artwork';

describe('Artwork Model Integration Tests', () => {
  beforeEach(async () => {
    // Clear all tables before each test to ensure isolation
    await db.delete(artworks);
    await db.delete(collections);
  });

  describe('Artwork Factory', () => {
    it('should create artwork with default values', async () => {
      const artwork = await artworkFactory.create();

      expect(artwork).toBeDefined();
      expect(artwork.id).toBeGreaterThan(0);
      expect(artwork.title).toBeDefined();
      expect(artwork.slug).toBeDefined();
      expect(artwork.artist).toBeDefined();
      expect(artwork.year).toBeGreaterThan(1900);
      expect(artwork.locale).toBe('en');
      expect(artwork.publishedAt).toBeNull(); // Default is draft
    });

    it('should create published artwork using trait', async () => {
      const artwork = await artworkFactory.published().create();

      expect(artwork.publishedAt).toBeInstanceOf(Date);
    });

    it('should create draft artwork using trait', async () => {
      const artwork = await artworkFactory.draft().create();

      expect(artwork.publishedAt).toBeNull();
    });

    it('should create artwork with collection using trait', async () => {
      const collection = await collectionFactory.create();
      const artwork = await artworkFactory.withCollection(collection.id).create();

      expect(artwork.collectionId).toBe(collection.id);
    });

    it('should create artwork with images using trait', async () => {
      const artwork = await artworkFactory.withImages(3).create();

      expect(artwork.imagesJson).toBeDefined();
      expect(artwork.defaultImageUrl).toBeDefined();

      if (artwork.imagesJson) {
        const images = JSON.parse(artwork.imagesJson);
        expect(images).toHaveLength(3);
        expect(images[0]).toHaveProperty('url');
        expect(images[0]).toHaveProperty('id');
      }
    });

    it('should create multiple artworks', async () => {
      const artworks = await artworkFactory.createList(5);

      expect(artworks).toHaveLength(5);
      artworks.forEach((artwork) => {
        expect(artwork.id).toBeGreaterThan(0);
        expect(artwork.slug).toBeDefined();
      });
    });
  });

  describe('findArtworks - Filtering', () => {
    it('should return all artworks when no filters provided', async () => {
      await artworkFactory.createList(3);

      const result = await findArtworks({});

      expect(result).toHaveLength(3);
    });

    it('should filter artworks by slug', async () => {
      const artwork1 = await artworkFactory.create({ slug: 'test-artwork-1' });
      await artworkFactory.create({ slug: 'test-artwork-2' });
      await artworkFactory.create({ slug: 'test-artwork-3' });

      const result = await findArtworks({ slug: ['test-artwork-1'] });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('test-artwork-1');
    });

    it('should filter artworks by multiple slugs', async () => {
      await artworkFactory.create({ slug: 'artwork-1' });
      await artworkFactory.create({ slug: 'artwork-2' });
      await artworkFactory.create({ slug: 'artwork-3' });

      const result = await findArtworks({ slug: ['artwork-1', 'artwork-3'] });

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.slug)).toContain('artwork-1');
      expect(result.map((a) => a.slug)).toContain('artwork-3');
    });

    it('should filter artworks by year', async () => {
      await artworkFactory.create({ year: 2020 });
      await artworkFactory.create({ year: 2021 });
      await artworkFactory.create({ year: 2022 });

      const result = await findArtworks({ year: [2021] });

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2021);
    });

    it('should filter artworks by multiple years', async () => {
      await artworkFactory.create({ year: 2020 });
      await artworkFactory.create({ year: 2021 });
      await artworkFactory.create({ year: 2022 });

      const result = await findArtworks({ year: [2020, 2022] });

      expect(result).toHaveLength(2);
      expect(result.map((a) => a.year)).toContain(2020);
      expect(result.map((a) => a.year)).toContain(2022);
    });

    it('should filter artworks by published status (published)', async () => {
      await artworkFactory.published().create();
      await artworkFactory.published().create();
      await artworkFactory.draft().create();

      const result = await findArtworks({ published: true });

      expect(result).toHaveLength(2);
      result.forEach((artwork) => {
        expect(artwork.publishedAt).toBeInstanceOf(Date);
      });
    });

    it('should filter artworks by published status (drafts)', async () => {
      await artworkFactory.published().create();
      await artworkFactory.draft().create();
      await artworkFactory.draft().create();

      const result = await findArtworks({ published: false });

      expect(result).toHaveLength(2);
      result.forEach((artwork) => {
        expect(artwork.publishedAt).toBeNull();
      });
    });

    it('should filter artworks by collection ID', async () => {
      const collection1 = await collectionFactory.create();
      const collection2 = await collectionFactory.create();

      await artworkFactory.withCollection(collection1.id).create();
      await artworkFactory.withCollection(collection1.id).create();
      await artworkFactory.withCollection(collection2.id).create();

      const result = await findArtworks({ collectionId: [collection1.id] });

      expect(result).toHaveLength(2);
      result.forEach((artwork) => {
        expect(artwork.collectionId).toBe(collection1.id);
      });
    });

    it('should filter artworks by locale', async () => {
      await artworkFactory.create({ locale: 'en' });
      await artworkFactory.create({ locale: 'en' });
      await artworkFactory.create({ locale: 'fr' });

      const result = await findArtworks({ locale: ['en'] });

      expect(result).toHaveLength(2);
      result.forEach((artwork) => {
        expect(artwork.locale).toBe('en');
      });
    });

    it('should combine multiple filters', async () => {
      await artworkFactory.published().create({ year: 2020, locale: 'en' });
      await artworkFactory.published().create({ year: 2021, locale: 'en' });
      await artworkFactory.draft().create({ year: 2020, locale: 'en' });

      const result = await findArtworks({
        year: [2020],
        published: true,
        locale: ['en'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(2020);
      expect(result[0].publishedAt).toBeInstanceOf(Date);
      expect(result[0].locale).toBe('en');
    });
  });

  describe('findArtworksWithCollections - Relationships', () => {
    it('should return artworks with null collection when not linked', async () => {
      await artworkFactory.create();

      const result = await findArtworksWithCollections({});

      expect(result).toHaveLength(1);
      expect(result[0].collection).toBeNull();
    });

    it('should return artworks with collection data when linked', async () => {
      const collection = await collectionFactory.create({ name: 'Test Collection' });
      await artworkFactory.withCollection(collection.id).create();

      const result = await findArtworksWithCollections({});

      expect(result).toHaveLength(1);
      expect(result[0].collection).toBeDefined();
      expect(result[0].collection?.name).toBe('Test Collection');
    });

    it('should filter artworks with collections by slug', async () => {
      const collection = await collectionFactory.create();
      await artworkFactory.withCollection(collection.id).create({ slug: 'artwork-1' });
      await artworkFactory.withCollection(collection.id).create({ slug: 'artwork-2' });

      const result = await findArtworksWithCollections({ slug: ['artwork-1'] });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('artwork-1');
      expect(result[0].collection).toBeDefined();
    });
  });

  describe('Artwork CRUD Operations', () => {
    it('should create an artwork', async () => {
      const created = await artworkFactory.create({
        title: 'Starry Night',
        artist: 'Vincent van Gogh',
        year: 1889,
      });

      expect(created.id).toBeGreaterThan(0);
      expect(created.title).toBe('Starry Night');
      expect(created.artist).toBe('Vincent van Gogh');
      expect(created.year).toBe(1889);
    });

    it('should update an artwork', async () => {
      const created = await artworkFactory.create({ title: 'Original Title' });

      const updated = await db
        .update(artworks)
        .set({ title: 'Updated Title' })
        .where(eq(artworks.id, created.id))
        .returning();

      expect(updated[0]?.title).toBe('Updated Title');
    });

    it('should delete an artwork', async () => {
      const created = await artworkFactory.create();

      await db
        .delete(artworks)
        .where(eq(artworks.id, created.id));

      const result = await findArtworks({ id: [created.id] });
      expect(result).toHaveLength(0);
    });
  });
});
