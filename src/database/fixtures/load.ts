/**
 * Fixtures loader for seeding the database with sample data.
 *
 * This script loads fixtures from JSON files (Rails-style) and uses
 * factories to insert data into the database.
 *
 * Can be used as:
 * 1. Imported function: loadFixtures(db) - for auto-loading on startup
 * 2. CLI script: npm run db:fixtures:load
 */

import type { Database } from '@/database';
import { collections, artworks, artworksToCollections, users } from '@/database/schema';
import path from 'path';
import fs from 'fs';

// Fixture types
interface CollectionFixture {
  name: string;
  slug: string;
  description?: string;
  publishedAt?: string;
  locale?: string;
}

interface ArtworkFixture {
  title: string;
  slug: string;
  description?: string;
  artist?: string;
  year?: number;
  price?: number;
  images?: string[];
  collectionSlug?: string;
  isDefaultForCollection?: boolean; // New field to mark default artwork
  publishedAt?: string;
  locale?: string;
}

interface ArtworkImage {
  id: string;
  url: string;
  alternativeText?: string;
  caption?: string;
}

/**
 * Clear all data from collections and artworks tables
 */
async function clearData(database: Database) {
  console.log('🗑️  Clearing existing data...');
  await database.delete(artworksToCollections);
  await database.delete(artworks);
  await database.delete(collections);
  await database.delete(users);
  console.log('✅ Data cleared');
}

/**
 * Load development users for authentication
 */
async function loadUsers(database: Database) {
  console.log('👥 Loading development users...');

  // Create admin user
  const [adminUser] = await database.insert(users).values({
    email: 'admin@example.com',
    name: 'Admin User',
    admin: true,
    image: 'https://avatars.githubusercontent.com/u/67470890?s=200&v=4',
  }).returning();
  console.log(`  ✓ Created admin user: ${adminUser.email}`);

  // Create regular user
  const [regularUser] = await database.insert(users).values({
    email: 'user@example.com',
    name: 'Regular User',
    admin: false,
    image: 'https://avatars.githubusercontent.com/u/67470890?s=200&v=4',
  }).returning();
  console.log(`  ✓ Created regular user: ${regularUser.email}`);
}

/**
 * Load collections from fixtures
 */
async function loadCollections(database: Database): Promise<Map<string, number>> {
  console.log('📦 Loading collections...');

  const fixturesPath = path.join(process.cwd(), 'fixtures', 'collections.json');
  const fixturesData = fs.readFileSync(fixturesPath, 'utf-8');
  const collectionFixtures: CollectionFixture[] = JSON.parse(fixturesData);

  const slugToIdMap = new Map<string, number>();

  for (const fixture of collectionFixtures) {
    const [created] = await database.insert(collections).values({
      name: fixture.name,
      slug: fixture.slug,
      description: fixture.description || null,
      publishedAt: fixture.publishedAt ? new Date(fixture.publishedAt) : null,
      locale: fixture.locale || 'en',
    }).returning();

    slugToIdMap.set(fixture.slug, created.id);
    console.log(`  ✓ Created collection: ${fixture.name} (${fixture.slug})`);
  }

  return slugToIdMap;
}

/**
 * Load artworks from fixtures
 */
async function loadArtworks(database: Database, collectionSlugToId: Map<string, number>) {
  console.log('🖼️  Loading artworks...');

  const fixturesPath = path.join(process.cwd(), 'fixtures', 'artworks.json');
  const fixturesData = fs.readFileSync(fixturesPath, 'utf-8');
  const artworkFixtures: ArtworkFixture[] = JSON.parse(fixturesData);

  for (const fixture of artworkFixtures) {
    // Process images into JSON structure
    let imagesJson: string | null = null;
    let defaultImageUrl: string | null = null;

    if (fixture.images && fixture.images.length > 0) {
      const images: ArtworkImage[] = fixture.images.map((url, index) => ({
        id: `img-${fixture.slug}-${index}`,
        url,
        alternativeText: `${fixture.title} - Image ${index + 1}`,
        caption: fixture.title,
      }));

      imagesJson = JSON.stringify(images);
      defaultImageUrl = images[0].url;
    }

    // Create artwork without collection reference
    const [createdArtwork] = await database.insert(artworks).values({
      title: fixture.title,
      slug: fixture.slug,
      description: fixture.description || null,
      artist: fixture.artist || null,
      year: fixture.year || null,
      price: fixture.price || null,
      defaultImageUrl,
      imagesJson,
      publishedAt: fixture.publishedAt ? new Date(fixture.publishedAt) : null,
      locale: fixture.locale || 'en',
    }).returning();

    // Create artwork-to-collection relationship if collection is specified
    if (fixture.collectionSlug) {
      const collectionId = collectionSlugToId.get(fixture.collectionSlug);
      if (collectionId) {
        await database.insert(artworksToCollections).values({
          artworkId: createdArtwork.id,
          collectionId: collectionId,
          isDefaultForCollection: fixture.isDefaultForCollection || false,
        });
        console.log(`  ✓ Created artwork: ${fixture.title} (${fixture.slug}) - ${fixture.images?.length || 0} images - Collection: ${fixture.collectionSlug}${fixture.isDefaultForCollection ? ' (DEFAULT)' : ''}`);
      } else {
        console.log(`  ⚠️  Created artwork: ${fixture.title} (${fixture.slug}) - Collection '${fixture.collectionSlug}' not found`);
      }
    } else {
      console.log(`  ✓ Created artwork: ${fixture.title} (${fixture.slug}) - ${fixture.images?.length || 0} images - No collection`);
    }
  }
}

/**
 * Main function to load all fixtures
 */
export async function loadFixtures(database: Database) {
  console.log('🚀 Loading fixtures...\n');

  // Clear existing data
  await clearData(database);
  console.log('');

  // Load users first (for authentication)
  await loadUsers(database);
  console.log('');

  // Load collections (for foreign key relationships)
  const collectionSlugToId = await loadCollections(database);
  console.log('');

  // Load artworks
  await loadArtworks(database, collectionSlugToId);
  console.log('');

  console.log('✨ Fixtures loaded successfully!');
}

// If running as a script (not imported)
if (require.main === module) {
  (async () => {
    try {
      // Import the database creation function directly
      const { createDatabaseClient } = await import('@/database');

      // Use the same database client logic as the rest of the app
      const db = createDatabaseClient();

      // Log connection info
      if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        console.log(`📡 Connecting to Turso: ${process.env.TURSO_DATABASE_URL}`);
      } else if (process.env.DATABASE_URL) {
        console.log(`📡 Connecting to database: ${process.env.DATABASE_URL}`);
      } else {
        console.log(`📡 Connecting to local database: http://localhost:${process.env.DB_PORT || 8080}`);
      }

      await loadFixtures(db);
      process.exit(0);
    } catch (error) {
      console.error('❌ Error loading fixtures:', error);
      process.exit(1);
    }
  })();
}
