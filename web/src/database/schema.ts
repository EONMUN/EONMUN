import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Export auth tables
export * from './schema.auth';

// Collections table
export const collections = sqliteTable('collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  locale: text('locale').notNull().default('en'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index('collections_slug_idx').on(table.slug),
}));

// Artworks table
export const artworks = sqliteTable('artworks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  artist: text('artist'),
  year: integer('year'),
  price: integer('price'), // Price in cents
  defaultImageUrl: text('default_image_url'),
  imagesJson: text('images_json'), // JSON array of image objects
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  locale: text('locale').notNull().default('en'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index('artworks_slug_idx').on(table.slug),
}));

// Junction table for many-to-many relationship between artworks and collections
export const artworksToCollections = sqliteTable('artworks_to_collections', {
  artworkId: integer('artwork_id').notNull().references(() => artworks.id, { onDelete: 'cascade' }),
  collectionId: integer('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  isDefaultForCollection: integer('is_default_for_collection', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  pk: primaryKey({ columns: [table.artworkId, table.collectionId] }),
  // Unique partial index: Only one default artwork per collection
  oneDefaultPerCollection: uniqueIndex('artwork_collection_one_default_per_collection')
    .on(table.collectionId)
    .where(sql`${table.isDefaultForCollection} = 1`),
}));

// Define relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  artworksToCollections: many(artworksToCollections),
}));

export const artworksRelations = relations(artworks, ({ many }) => ({
  artworksToCollections: many(artworksToCollections),
}));

export const artworksToCollectionsRelations = relations(artworksToCollections, ({ one }) => ({
  artwork: one(artworks, {
    fields: [artworksToCollections.artworkId],
    references: [artworks.id],
  }),
  collection: one(collections, {
    fields: [artworksToCollections.collectionId],
    references: [collections.id],
  }),
}));
