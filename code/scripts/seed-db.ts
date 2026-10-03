import { readFile } from 'node:fs/promises';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql } from 'drizzle-orm';
import {
	artworks, artworkImages, artworksToCollections, artworksToFacets, collections,
	facets, homepageArtworks, posts, postsToArtworks, postsToCollections, products,
} from '../src/db/schema';

// SECURITY: This command is only for the local fixture database.
const url = process.env.DATABASE_URL;
if (!url || !/^http:\/\/(localhost|127\.0\.0\.1|libsql)(:\d+)?\/?$/.test(url)
	|| process.env.TURSO_DATABASE_URL || process.env.TURSO_AUTH_TOKEN) {
	throw new Error('db:seed requires a local DATABASE_URL and no Turso credentials');
}
const client = createClient({ url });
const db = drizzle(client);
const fixture = async <T>(name: string): Promise<T> => JSON.parse(
	await readFile(new URL(`../../fixtures/${name}.json`, import.meta.url), 'utf8'),
);
const date = (value?: string | null) => value ? new Date(value) : null;

try {
	await db.run(sql`PRAGMA foreign_keys = OFF`);
	for (const table of [postsToArtworks, postsToCollections, posts, homepageArtworks,
		products, artworksToFacets, facets, artworksToCollections, artworkImages, artworks, collections]) {
		await db.delete(table);
	}
	await db.run(sql`PRAGMA foreign_keys = ON`);

	const collectionIds = new Map<string, number>();
	for (const item of await fixture<Array<{name: string; slug: string; description?: string; publishedAt?: string; locale?: string}>>('collections')) {
		const [row] = await db.insert(collections).values({ ...item, publishedAt: date(item.publishedAt) }).returning({ id: collections.id });
		collectionIds.set(item.slug, row.id);
	}

	const artworkData = new Map<string, {id: number; title: string; imageUrl: string | null}>();
	const artworkTags = new Map<string, string[]>();
	const artworkFacets = new Map<string, { namespace: string; key: string; value: string }[]>();
	for (const item of await fixture<Array<{title: string; slug: string; description?: string; tags?: string[]; facets?: { namespace: string; key: string; value: string }[]; imageAltText?: string; artist?: string; year?: number; width?: number; height?: number; depth?: number; dimensionUnit?: "in" | "cm"; images?: string[]; collectionSlug?: string; isDefaultForCollection?: boolean; publishedAt?: string; locale?: string}>>('artworks')) {
		const [row] = await db.insert(artworks).values({ title: item.title, slug: item.slug,
			description: item.description, artist: item.artist, year: item.year,
            width: item.width, height: item.height, depth: item.depth, dimensionUnit: item.dimensionUnit,
			publishedAt: date(item.publishedAt), locale: item.locale }).returning({ id: artworks.id });
		artworkData.set(item.slug, { id: row.id, title: item.title, imageUrl: item.images?.[0] ?? null });
		artworkTags.set(item.slug, item.tags ?? []);
		artworkFacets.set(item.slug, item.facets ?? []);
		for (const [index, imageUrl] of (item.images ?? []).entries()) {
			await db.insert(artworkImages).values({ artworkId: row.id, url: imageUrl, caption: item.title, altText: index === 0 ? item.imageAltText : null, isDefault: index === 0 });
		}
		const collectionId = item.collectionSlug && collectionIds.get(item.collectionSlug);
		if (collectionId) await db.insert(artworksToCollections).values({ artworkId: row.id, collectionId, isDefaultForCollection: item.isDefaultForCollection ?? false });
	}

	for (const item of await fixture<Array<{type: string; artworkSlug?: string; name?: string; slug?: string; description?: string; imageUrl?: string; price: number; quantity?: number}>>('products')) {
		const artwork = item.artworkSlug && artworkData.get(item.artworkSlug);
		const name = item.name ?? artwork?.title;
		const slug = item.slug ?? item.artworkSlug;
		if (!name || !slug) continue;
		await db.insert(products).values({ type: item.type, artworkId: artwork?.id, name, slug,
			description: item.description, imageUrl: item.imageUrl ?? artwork?.imageUrl,
			price: item.price, quantity: item.quantity ?? (item.type === 'artwork' ? 1 : null) });
	}

	for (const item of await fixture<Array<{namespace: string; key: string; value: string; description?: string; artworkSlugs?: string[]}>>('facets')) {
		const [row] = await db.insert(facets).values({ namespace: item.namespace, key: item.key, value: item.value, description: item.description }).returning({ id: facets.id });
		for (const slug of item.artworkSlugs ?? []) {
			const artwork = artworkData.get(slug);
			if (artwork) await db.insert(artworksToFacets).values({ artworkId: artwork.id, facetId: row.id });
		}
	}
	for (const [artworkSlug, tags] of artworkTags) {
		const artwork = artworkData.get(artworkSlug)!;
		for (const { namespace, key, value } of [...tags.map((value) => ({ namespace: 'artwork', key: 'tag', value })), ...artworkFacets.get(artworkSlug) ?? []]) {
			await db.insert(facets).values({ namespace, key, value }).onConflictDoNothing();
			const [facet] = await db.select({ id: facets.id }).from(facets).where(sql`${facets.namespace} = ${namespace} AND ${facets.key} = ${key} AND ${facets.value} = ${value} COLLATE NOCASE`);
			await db.insert(artworksToFacets).values({ artworkId: artwork.id, facetId: facet.id });
		}
	}

	for (const item of await fixture<Array<{title: string; slug: string; body: string; excerpt?: string; postType: string; coverImageUrl?: string; publishedAt?: string; scheduledAt?: string; createdAt: string; updatedAt: string; locale?: string; artworkSlugs?: string[]; collectionSlugs?: string[]}>>('posts')) {
		const [row] = await db.insert(posts).values({ title: item.title, slug: item.slug, body: item.body,
			excerpt: item.excerpt, postType: item.postType, coverImageUrl: item.coverImageUrl,
			publishedAt: date(item.publishedAt), scheduledAt: date(item.scheduledAt),
			createdAt: new Date(item.createdAt), updatedAt: new Date(item.updatedAt), locale: item.locale }).returning({ id: posts.id });
		for (const slug of item.artworkSlugs ?? []) {
			const artwork = artworkData.get(slug);
			if (artwork) await db.insert(postsToArtworks).values({ postId: row.id, artworkId: artwork.id });
		}
		for (const slug of item.collectionSlugs ?? []) {
			const collectionId = collectionIds.get(slug);
			if (collectionId) await db.insert(postsToCollections).values({ postId: row.id, collectionId });
		}
	}
	for (const [position, slug] of (await fixture<string[]>('homepage')).entries()) {
		const artwork = artworkData.get(slug);
		if (artwork) await db.insert(homepageArtworks).values({ artworkId: artwork.id, position });
	}
	console.log(`Seeded ${artworkData.size} artworks and ${collectionIds.size} collections`);
} finally {
	client.close();
}
