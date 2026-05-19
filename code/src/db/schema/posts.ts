// Read-only schema copy of `~/repos/EONMUN/EONMUN/src/database/schema.posts.ts`.
import {
	sqliteTable,
	text,
	integer,
	index,
	primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { artworks, collections } from "./artworks";

export type PostType =
	| "announcement"
	| "educational"
	| "behind_the_scenes"
	| "general";

export const posts = sqliteTable(
	"posts",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		title: text("title").notNull(),
		slug: text("slug").notNull().unique(),
		body: text("body").notNull().default(""),
		excerpt: text("excerpt"),
		postType: text("post_type").notNull().default("general"),
		coverImageUrl: text("cover_image_url"),
		publishedAt: integer("published_at", { mode: "timestamp" }),
		scheduledAt: integer("scheduled_at", { mode: "timestamp" }),
		locale: text("locale").notNull().default("en"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		slugIdx: index("posts_slug_idx").on(table.slug),
		publishedAtIdx: index("posts_published_at_idx").on(table.publishedAt),
		postTypeIdx: index("posts_post_type_idx").on(table.postType),
	}),
);

export const postsToArtworks = sqliteTable(
	"posts_to_artworks",
	{
		postId: integer("post_id")
			.notNull()
			.references(() => posts.id, { onDelete: "cascade" }),
		artworkId: integer("artwork_id")
			.notNull()
			.references(() => artworks.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.artworkId] }),
		artworkIdx: index("posts_to_artworks_artwork_idx").on(table.artworkId),
	}),
);

export const postsToCollections = sqliteTable(
	"posts_to_collections",
	{
		postId: integer("post_id")
			.notNull()
			.references(() => posts.id, { onDelete: "cascade" }),
		collectionId: integer("collection_id")
			.notNull()
			.references(() => collections.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.postId, table.collectionId] }),
		collectionIdx: index("posts_to_collections_collection_idx").on(
			table.collectionId,
		),
	}),
);

export const postsRelations = relations(posts, ({ many }) => ({
	postsToArtworks: many(postsToArtworks),
	postsToCollections: many(postsToCollections),
}));

export const postsToArtworksRelations = relations(
	postsToArtworks,
	({ one }) => ({
		post: one(posts, {
			fields: [postsToArtworks.postId],
			references: [posts.id],
		}),
		artwork: one(artworks, {
			fields: [postsToArtworks.artworkId],
			references: [artworks.id],
		}),
	}),
);

export const postsToCollectionsRelations = relations(
	postsToCollections,
	({ one }) => ({
		post: one(posts, {
			fields: [postsToCollections.postId],
			references: [posts.id],
		}),
		collection: one(collections, {
			fields: [postsToCollections.collectionId],
			references: [collections.id],
		}),
	}),
);

export type InsertPost = typeof posts.$inferInsert;
export type SelectPost = typeof posts.$inferSelect;
