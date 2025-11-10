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

// Uploads table - tracks all file uploads (local and R2 storage)
export const uploads = sqliteTable('uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // File information
  fileName: text('file_name').notNull(),
  storagePath: text('storage_path').notNull(),
  fileSize: integer('file_size').notNull(), // Size in bytes
  mimeType: text('mime_type').notNull(),

  // Storage location
  storageType: text('storage_type').notNull(), // 'local' | 'r2'
  storageUrl: text('storage_url').notNull(),

  // Image metadata (optional, null for non-images)
  width: integer('width'),
  height: integer('height'),
  alternativeText: text('alternative_text'),
  caption: text('caption'),

  // Soft delete flag
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  storagePathIdx: index('uploads_storage_path_idx').on(table.storagePath),
  isDeletedIdx: index('uploads_is_deleted_idx').on(table.isDeleted),
}));

// Artwork Uploads join table - manages many-to-many relationship between artworks and uploads
export const artworkUploads = sqliteTable('artwork_uploads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  artworkId: integer('artwork_id').notNull().references(() => artworks.id, { onDelete: 'cascade' }),
  uploadId: integer('upload_id').notNull().references(() => uploads.id, { onDelete: 'cascade' }),

  // Default flag - indicates which upload should show in the UI for this artwork
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => ({
  artworkIdIdx: index('artwork_uploads_artwork_id_idx').on(table.artworkId),
  uploadIdIdx: index('artwork_uploads_upload_id_idx').on(table.uploadId),
  artworkDefaultIdx: index('artwork_uploads_artwork_default_idx').on(table.artworkId, table.isDefault),
}));

// Define relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  artworks: many(artworks),
}));

export const artworksRelations = relations(artworks, ({ one, many }) => ({
  collection: one(collections, {
    fields: [artworks.collectionId],
    references: [collections.id],
  }),
  artworkUploads: many(artworkUploads),
}));

export const uploadsRelations = relations(uploads, ({ many }) => ({
  artworkUploads: many(artworkUploads),
}));

export const artworkUploadsRelations = relations(artworkUploads, ({ one }) => ({
  artwork: one(artworks, {
    fields: [artworkUploads.artworkId],
    references: [artworks.id],
  }),
  upload: one(uploads, {
    fields: [artworkUploads.uploadId],
    references: [uploads.id],
  }),
}));
