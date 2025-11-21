/**
 * Factory for creating test collection data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const collection = collectionFactory.build();
 *
 * // Build with overrides
 * const artCollection = collectionFactory.build({
 *   name: 'Modern Art',
 *   slug: 'modern-art',
 * });
 *
 * // Use traits
 * const published = collectionFactory.published().build();
 * const draft = collectionFactory.draft().build();
 *
 * // Persist to database
 * const persistedCollection = await collectionFactory.create();
 *
 * // Build multiple
 * const collections = collectionFactory.buildList(5);
 * ```
 */

import { Factory, db } from './index';
import { collections } from '../schema';

// Type for inserting a collection
export type InsertCollection = typeof collections.$inferInsert;

// Type for a collection from the database
export type SelectCollection = typeof collections.$inferSelect;

/**
 * Collection factory with trait methods for common collection types.
 */
class CollectionFactory extends Factory<InsertCollection> {
  /**
   * Create a published collection (has publishedAt timestamp)
   */
  published() {
    return this.params({ publishedAt: new Date() });
  }

  /**
   * Create a draft collection (no publishedAt timestamp)
   */
  draft() {
    return this.params({ publishedAt: null });
  }

  /**
   * Create and persist a collection to the database.
   */
  async create(params?: Partial<InsertCollection>) {
    const collection = this.build(params);
    const [created] = await db.insert(collections).values(collection).returning();
    return created;
  }

  /**
   * Create and persist multiple collections to the database.
   */
  async createList(count: number, params?: Partial<InsertCollection>) {
    const collectionList = this.buildList(count, params);
    return await db.insert(collections).values(collectionList).returning();
  }
}

/**
 * Collection factory instance for use in tests and development.
 */
export const collectionFactory = CollectionFactory.define(({ sequence }) => ({
  // Don't set id - let SQLite auto-increment handle it
  name: `${Factory.faker.commerce.department()} Collection`,
  slug: `collection-${sequence}-${Date.now()}`,
  description: Factory.faker.lorem.paragraph(),
  publishedAt: null, // Default to draft, use .published() trait for published
  locale: 'en',
  // createdAt and updatedAt have defaults in the schema
}));
