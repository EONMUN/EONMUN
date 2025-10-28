import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import { collections, artworks, collectionsRelations, artworksRelations } from '@/db/schema';

// Use an in-memory database for tests
const TEST_DB_PATH = ':memory:';

describe('Collections Model Integration Tests', () => {
  let testDb: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;

  beforeEach(() => {
    // Create a fresh in-memory database for each test
    sqlite = new Database(TEST_DB_PATH);
    testDb = drizzle(sqlite, { 
      schema: { 
        collections, 
        artworks, 
        collectionsRelations, 
        artworksRelations 
      } 
    });

    // Create tables
    sqlite.exec(`
      CREATE TABLE collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    sqlite.exec(`
      CREATE TABLE artworks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        artist TEXT,
        price INTEGER,
        collection_id INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (collection_id) REFERENCES collections(id)
      )
    `);
  });

  afterEach(() => {
    // Close the database connection
    sqlite.close();
  });

  describe('Collection CRUD operations', () => {
    it('should create a new collection', async () => {
      const newCollection = {
        name: 'Modern Art Collection',
        description: 'A collection of contemporary artworks',
      };

      const collection = testDb.insert(collections).values(newCollection).returning().get();

      expect(collection).toBeDefined();
      expect(collection.id).toBeDefined();
      expect(collection.name).toBe('Modern Art Collection');
      expect(collection.description).toBe('A collection of contemporary artworks');
      expect(collection.createdAt).toBeInstanceOf(Date);
      expect(collection.updatedAt).toBeInstanceOf(Date);
    });

    it('should get all collections', async () => {
      // Create test data
      testDb.insert(collections).values({ name: 'Collection 1', description: 'First collection' }).run();
      testDb.insert(collections).values({ name: 'Collection 2', description: 'Second collection' }).run();

      const allCollections = testDb.select().from(collections).all();

      expect(allCollections).toHaveLength(2);
      expect(allCollections[0].name).toBe('Collection 1');
      expect(allCollections[1].name).toBe('Collection 2');
    });

    it('should get a collection by ID', async () => {
      const created = testDb.insert(collections).values({
        name: 'Test Collection',
        description: 'Test description',
      }).returning().get();

      const collection = testDb.select().from(collections).where(eq(collections.id, created.id)).get();

      expect(collection).toBeDefined();
      expect(collection?.id).toBe(created.id);
      expect(collection?.name).toBe('Test Collection');
    });

    it('should update a collection', async () => {
      const created = testDb.insert(collections).values({
        name: 'Original Name',
        description: 'Original description',
      }).returning().get();

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = testDb
        .update(collections)
        .set({ name: 'Updated Name', description: 'Updated description', updatedAt: new Date() })
        .where(eq(collections.id, created.id))
        .returning()
        .get();

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('should delete a collection', async () => {
      const created = testDb.insert(collections).values({
        name: 'To Be Deleted',
        description: 'This will be deleted',
      }).returning().get();

      testDb.delete(collections).where(eq(collections.id, created.id)).run();

      const collection = testDb.select().from(collections).where(eq(collections.id, created.id)).get();
      expect(collection).toBeUndefined();
    });
  });

  describe('Collection with Artworks queries', () => {
    it('should query artworks from a collection', async () => {
      // Create a collection
      const collection = testDb.insert(collections).values({
        name: 'Art Gallery',
        description: 'A curated collection of fine art',
      }).returning().get();

      // Insert artworks
      testDb.insert(artworks).values({
        title: 'Starry Night',
        description: 'A beautiful night sky painting',
        artist: 'Vincent van Gogh',
        price: 100000000, // $1,000,000 in cents
        collectionId: collection.id,
      }).run();

      testDb.insert(artworks).values({
        title: 'Mona Lisa',
        description: 'Famous portrait painting',
        artist: 'Leonardo da Vinci',
        price: 200000000, // $2,000,000 in cents
        collectionId: collection.id,
      }).run();

      // Query artworks by collection ID
      const artworksList = testDb.select().from(artworks).where(eq(artworks.collectionId, collection.id)).all();

      expect(artworksList).toHaveLength(2);
      expect(artworksList[0].title).toBe('Starry Night');
      expect(artworksList[0].artist).toBe('Vincent van Gogh');
      expect(artworksList[0].price).toBe(100000000);
      expect(artworksList[1].title).toBe('Mona Lisa');
      expect(artworksList[1].artist).toBe('Leonardo da Vinci');
      expect(artworksList[1].price).toBe(200000000);
    });

    it('should get collection with nested artworks using query API', async () => {
      // Create a collection
      const collection = testDb.insert(collections).values({
        name: 'Impressionist Collection',
        description: 'Collection of impressionist paintings',
      }).returning().get();

      // Insert artworks
      testDb.insert(artworks).values([
        {
          title: 'Water Lilies',
          description: 'Monet\'s water lilies series',
          artist: 'Claude Monet',
          price: 50000000,
          collectionId: collection.id,
        },
        {
          title: 'Dance at Le Moulin de la Galette',
          description: 'Renoir\'s famous dance scene',
          artist: 'Pierre-Auguste Renoir',
          price: 75000000,
          collectionId: collection.id,
        },
      ]).run();

      // Verify we can query collection directly
      const collectionCheck = testDb.select().from(collections).where(eq(collections.id, collection.id)).get();
      expect(collectionCheck).toBeDefined();
      expect(collectionCheck?.name).toBe('Impressionist Collection');

      // Verify artworks are there
      const artworksList = testDb.select().from(artworks).where(eq(artworks.collectionId, collection.id)).all();
      expect(artworksList).toHaveLength(2);
      expect(artworksList[0].title).toBe('Water Lilies');
      expect(artworksList[1].title).toBe('Dance at Le Moulin de la Galette');
    });

    it('should return empty array for collection with no artworks', async () => {
      // Create a collection without artworks
      const collection = testDb.insert(collections).values({
        name: 'Empty Collection',
        description: 'This collection has no artworks yet',
      }).returning().get();

      const artworksList = testDb.select().from(artworks).where(eq(artworks.collectionId, collection.id)).all();

      expect(artworksList).toHaveLength(0);
      expect(artworksList).toEqual([]);
    });
  });
});
