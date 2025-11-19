/**
 * Central factory utilities for test data generation.
 *
 * This module wraps fishery and faker to provide a consistent interface
 * for all test factories. All factories should import from this file
 * rather than directly from fishery or faker.
 *
 * @example
 * ```typescript
 * import { Factory, db } from '@/database/factories';
 *
 * class CollectionFactory extends Factory<InsertCollection> {
 *   published() {
 *     return this.params({ publishedAt: new Date() });
 *   }
 * }
 *
 * const collectionFactory = CollectionFactory.define(({ sequence }) => ({
 *   slug: `collection-${sequence}`,
 *   name: Factory.faker.company.name(),
 * }));
 *
 * const publishedCollection = collectionFactory.published().build();
 * ```
 */

import { Factory as FisheryFactory } from 'fishery';
import { faker as fakerInstance } from '@faker-js/faker';
import { db as database } from '@/lib/db';

/**
 * Factory class for defining test data factories.
 * Extend this class to add custom builder methods (traits).
 *
 * Access faker via Factory.faker for generating realistic fake data.
 *
 * @see https://github.com/thoughtbot/fishery
 * @see https://fakerjs.dev/
 */
export const Factory: typeof FisheryFactory & {
  faker: typeof fakerInstance;
} = FisheryFactory as typeof FisheryFactory & {
  faker: typeof fakerInstance;
};

/**
 * Faker instance for generating realistic fake data.
 * Available as static property on Factory class.
 */
Factory.faker = fakerInstance;

/**
 * Database instance for factory persistence.
 * Use this in factory create() methods to persist data.
 *
 * @example
 * ```typescript
 * async create(params) {
 *   const data = this.build(params);
 *   const [created] = await db.insert(collections).values(data).returning();
 *   return created;
 * }
 * ```
 */
export const db = database;

/**
 * Type helper for factory transient parameters.
 * Transient params affect factory behavior but aren't in the final object.
 *
 * @example
 * ```typescript
 * type ArtworkTransientParams = {
 *   includeImages?: boolean;
 *   includeCollection?: boolean;
 * };
 *
 * Factory.define<InsertArtwork, ArtworkTransientParams>(({ transientParams }) => ({
 *   imagesJson: transientParams.includeImages ? JSON.stringify([...]) : null
 * }))
 * ```
 */
export type TransientParams = Record<string, unknown>;

/**
 * Type helper for factory associations.
 * Associations are related objects that can be passed to factories.
 *
 * @example
 * ```typescript
 * type ArtworkAssociations = {
 *   collection?: InsertCollection;
 * };
 *
 * artworkFactory.build({}, {
 *   associations: {
 *     collection: collectionFactory.build()
 *   }
 * })
 * ```
 */
export type Associations = Record<string, unknown>;
