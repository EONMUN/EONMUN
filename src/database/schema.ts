import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Export auth tables
export * from "./schema.auth";

// Collections table
export const collections = sqliteTable(
  "collections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    locale: text("locale").notNull().default("en"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: index("collections_slug_idx").on(table.slug),
  }),
);

// Artworks table
export const artworks = sqliteTable(
  "artworks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    artist: text("artist"),
    year: integer("year"),
    // Dimensions
    width: real("width"),
    height: real("height"),
    depth: real("depth"),
    dimensionUnit: text("dimension_unit").default("in"), // 'in', 'cm', 'mm'
    defaultImageUrl: text("default_image_url"),
    imagesJson: text("images_json"), // JSON array of image objects
    homePageOrder: integer("home_page_order"), // Order on home page (null = not on home page)
    publishedAt: integer("published_at", { mode: "timestamp" }),
    locale: text("locale").notNull().default("en"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: index("artworks_slug_idx").on(table.slug),
  }),
);

// Junction table for many-to-many relationship between artworks and collections
export const artworksToCollections = sqliteTable(
  "artworks_to_collections",
  {
    artworkId: integer("artwork_id")
      .notNull()
      .references(() => artworks.id, { onDelete: "cascade" }),
    collectionId: integer("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    isDefaultForCollection: integer("is_default_for_collection", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.artworkId, table.collectionId] }),
    // Unique partial index: Only one default artwork per collection
    oneDefaultPerCollection: uniqueIndex(
      "artwork_collection_one_default_per_collection",
    )
      .on(table.collectionId)
      .where(sql`${table.isDefaultForCollection} = 1`),
  }),
);

// Define relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  artworksToCollections: many(artworksToCollections),
}));

export const artworksRelations = relations(artworks, ({ many }) => ({
  artworksToCollections: many(artworksToCollections),
  artworksToFacets: many(artworksToFacets),
  products: many(products),
}));

export const artworksToCollectionsRelations = relations(
  artworksToCollections,
  ({ one }) => ({
    artwork: one(artworks, {
      fields: [artworksToCollections.artworkId],
      references: [artworks.id],
    }),
    collection: one(collections, {
      fields: [artworksToCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

// Facets table - generic categorization system for materials, techniques, styles, etc.
export const facets = sqliteTable(
  "facets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: text("type").notNull(), // 'material', 'technique', 'style', etc.
    description: text("description"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugTypeUnique: uniqueIndex("facets_slug_type_unique").on(
      table.slug,
      table.type,
    ),
    typeIdx: index("facets_type_idx").on(table.type),
  }),
);

// Junction table for many-to-many relationship between artworks and facets
export const artworksToFacets = sqliteTable(
  "artworks_to_facets",
  {
    artworkId: integer("artwork_id")
      .notNull()
      .references(() => artworks.id, { onDelete: "cascade" }),
    facetId: integer("facet_id")
      .notNull()
      .references(() => facets.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.artworkId, table.facetId] }),
    facetIdx: index("artworks_to_facets_facet_idx").on(table.facetId),
  }),
);

// Facets relations
export const facetsRelations = relations(facets, ({ many }) => ({
  artworksToFacets: many(artworksToFacets),
}));

export const artworksToFacetsRelations = relations(
  artworksToFacets,
  ({ one }) => ({
    artwork: one(artworks, {
      fields: [artworksToFacets.artworkId],
      references: [artworks.id],
    }),
    facet: one(facets, {
      fields: [artworksToFacets.facetId],
      references: [facets.id],
    }),
  }),
);

// Products table - store items (artworks, prints, postcards, etc.)
export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    type: text("type").notNull(), // 'artwork' | 'print' | 'postcard' | etc.
    artworkId: integer("artwork_id").references(() => artworks.id, {
      onDelete: "set null",
    }), // nullable FK
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    price: integer("price").notNull(), // in cents
    quantity: integer("quantity"), // null for unique items (artworks), number for prints/postcards
    listedAt: integer("listed_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()), // auto-set on create
    soldAt: integer("sold_at", { mode: "timestamp" }), // for unique items only
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    slugIdx: index("products_slug_idx").on(table.slug),
    typeIdx: index("products_type_idx").on(table.type),
    artworkIdx: index("products_artwork_idx").on(table.artworkId),
  }),
);

// Products relations
export const productsRelations = relations(products, ({ one }) => ({
  artwork: one(artworks, {
    fields: [products.artworkId],
    references: [artworks.id],
  }),
}));
