import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

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
  collectionId: integer('collection_id').references(() => collections.id),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  slugIdx: index('artworks_slug_idx').on(table.slug),
}));

// Define relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  artworks: many(artworks),
}));

export const artworksRelations = relations(artworks, ({ one }) => ({
  collection: one(collections, {
    fields: [artworks.collectionId],
    references: [collections.id],
  }),
}));
