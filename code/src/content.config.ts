import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const artworkImages = z.object({
	url: z.string().url(),
	isDefault: z.boolean().default(false),
	caption: z.string().nullable().optional(),
});

const posts = defineCollection({
	loader: glob({
		base: "./src/content/posts",
		pattern: "**/*.{md,mdx}",
	}),
	schema: z.object({
		title: z.string(),
		excerpt: z.string().nullable().optional(),
		postType: z.enum([
			"announcement",
			"educational",
			"behind_the_scenes",
			"general",
		]),
		coverImageUrl: z.string().url().nullable().optional(),
		publishedAt: z.string().datetime().nullable().optional(),
		scheduledAt: z.string().datetime().nullable().optional(),
		locale: z.string().default("en"),
		artworkSlugs: z.array(z.string()).default([]),
		collectionSlugs: z.array(z.string()).default([]),
	}),
});

const artworks = defineCollection({
	loader: glob({
		base: "./src/content/artworks",
		pattern: "**/*.{md,mdx}",
	}),
	schema: z.object({
		title: z.string(),
		description: z.string().nullable().optional(),
		artist: z.string().nullable().optional(),
		year: z.number().int().nullable().optional(),
		publishedAt: z.string().datetime().nullable().optional(),
		locale: z.string().default("en"),
		isDefaultForCollection: z.boolean().default(false),
		collectionSlugs: z.array(z.string()).default([]),
		images: z.array(artworkImages).default([]),
	}),
});

export const collections = { posts, artworks };
