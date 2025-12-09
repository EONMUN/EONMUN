/**
 * Factory for creating test artwork data.
 *
 * @example
 * ```typescript
 * // Build in-memory object
 * const artwork = artworkFactory.build();
 *
 * // Build with overrides
 * const painting = artworkFactory.build({
 *   title: 'Starry Night',
 *   artist: 'Vincent van Gogh',
 *   year: 1889,
 * });
 *
 * // Use traits
 * const published = artworkFactory.published().build();
 * const draft = artworkFactory.draft().build();
 * const withCollection = artworkFactory.withCollection(collectionId).build();
 * const withImages = artworkFactory.withImages(3).build();
 *
 * // Persist to database
 * const persistedArtwork = await artworkFactory.create();
 *
 * // Build multiple
 * const artworks = artworkFactory.buildList(5);
 * ```
 */

import { Factory, db } from "./index";
import { artworks } from "../schema";

// Type for inserting an artwork
export type InsertArtwork = typeof artworks.$inferInsert;

// Type for an artwork from the database
export type SelectArtwork = typeof artworks.$inferSelect;

/**
 * Image interface for the imagesJson field
 */
export interface ArtworkImage {
  id: string;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
}

/**
 * Artwork factory with trait methods for common artwork types.
 */
class ArtworkFactory extends Factory<InsertArtwork> {
  /**
   * Create a published artwork (has publishedAt timestamp)
   */
  published() {
    return this.params({ publishedAt: new Date() });
  }

  /**
   * Create a draft artwork (no publishedAt timestamp)
   */
  draft() {
    return this.params({ publishedAt: null });
  }

  /**
   * Create an artwork linked to a collection
   * TODO: Update for many-to-many relationship
   */
  // withCollection(collectionId: number) {
  //   return this.params({ collectionId });
  // }

  /**
   * Create an artwork with multiple images
   */
  withImages(count: number = 3) {
    const images: ArtworkImage[] = Array.from({ length: count }, () => ({
      id: `img-${Factory.faker.string.uuid()}`,
      url: Factory.faker.image.url(),
      alternativeText: Factory.faker.lorem.sentence(),
      caption: Factory.faker.lorem.sentence(),
      width: Factory.faker.number.int({ min: 800, max: 2000 }),
      height: Factory.faker.number.int({ min: 800, max: 2000 }),
    }));

    return this.params({
      imagesJson: JSON.stringify(images),
      defaultImageUrl: images[0].url,
    });
  }

  /**
   * Create and persist an artwork to the database.
   */
  async create(params?: Partial<InsertArtwork>) {
    const artwork = this.build(params);
    const [created] = await db.insert(artworks).values(artwork).returning();
    return created;
  }

  /**
   * Create and persist multiple artworks to the database.
   */
  async createList(count: number, params?: Partial<InsertArtwork>) {
    const artworkList = this.buildList(count, params);
    return await db.insert(artworks).values(artworkList).returning();
  }
}

/**
 * Artwork factory instance for use in tests and development.
 */
export const artworkFactory = ArtworkFactory.define(({ sequence }) => ({
  // Don't set id - let SQLite auto-increment handle it
  title: Factory.faker.lorem.words(3),
  slug: `artwork-${sequence}-${Date.now()}`,
  description: Factory.faker.lorem.paragraph(),
  artist: Factory.faker.person.fullName(),
  year: Factory.faker.number.int({ min: 1900, max: new Date().getFullYear() }),
  defaultImageUrl: Factory.faker.image.url(),
  imagesJson: null, // Default to no images, use .withImages() trait for images
  publishedAt: null, // Default to draft, use .published() trait for published
  locale: "en",
  // createdAt and updatedAt have defaults in the schema
}));
