import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

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

export const collections = { posts };
