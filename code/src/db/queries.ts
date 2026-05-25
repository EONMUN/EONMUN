// Query helpers for SSR routes. Read-only; no mutations from the Astro worker.
// Distilled from `~/repos/EONMUN/EONMUN/src/models/*.ts`.
import { and, desc, eq, gt, inArray, isNotNull, isNull, lte, or } from "drizzle-orm";
import {
	getDb,
	type Env,
	artworks,
	artworkImages,
	artworksToCollections,
	collections,
	homepageArtworks,
	posts,
	postsToArtworks,
	postsToCollections,
	products,
	type SelectArtwork as BaseSelectArtwork,
	type SelectCollection,
	type SelectPost,
	type SelectProduct,
	type PostType,
} from "./index";

export interface ArtworkWithDefaultImage extends BaseSelectArtwork {
	defaultImageUrl: string | null;
}

export interface ArtworkCollectionRef {
	id: number;
	slug: string;
	name: string;
}

export interface ArtworkListItem extends ArtworkWithDefaultImage {
	collections: ArtworkCollectionRef[];
}

export interface ArtworkDetail extends ArtworkWithDefaultImage {
	collections: SelectCollection[];
	images: { url: string; isDefault: boolean; caption: string | null }[];
	product: SelectProduct | null;
}

export interface CollectionWithArtworks extends SelectCollection {
	artworks: ArtworkWithDefaultImage[];
}

export interface PostWithRelations extends SelectPost {
	artworks: {
		id: number;
		slug: string;
		title: string;
		defaultImageUrl: string | null;
	}[];
	collections: { id: number; slug: string; name: string }[];
}

export interface ProductWithArtwork extends SelectProduct {
	artwork: ArtworkWithDefaultImage | null;
}

export interface ProductAvailability {
	slug: string;
	type: string;
	available: boolean;
	status: "available" | "sold" | "out_of_stock";
}

function publishedCondition() {
	const now = new Date();
	return or(
		isNotNull(posts.publishedAt),
		and(isNotNull(posts.scheduledAt), lte(posts.scheduledAt, now)),
	);
}

export async function getPublishedPosts(
	env: Env,
	postType?: PostType,
): Promise<SelectPost[]> {
	const db = getDb(env);
	const conditions = [publishedCondition()];
	if (postType) conditions.push(eq(posts.postType, postType));
	const rows = await db
		.select()
		.from(posts)
		.where(and(...conditions))
		.orderBy(desc(posts.publishedAt));
	return rows;
}

export async function getPostBySlug(
	env: Env,
	slug: string,
): Promise<PostWithRelations | null> {
	const db = getDb(env);
	const [post] = await db.select().from(posts).where(eq(posts.slug, slug));
	if (!post) return null;

	// Only surface published posts. Drafts (no publishedAt, no scheduledAt
	// in the past) shouldn't be reachable via SSR — admin preview is out
	// of scope for this worker.
	const now = new Date();
	const isPublished =
		post.publishedAt !== null ||
		(post.scheduledAt !== null && post.scheduledAt <= now);
	if (!isPublished) return null;

	const [artworkRows, collectionRows] = await Promise.all([
		db
			.select({
				artworkId: artworks.id,
				slug: artworks.slug,
				title: artworks.title,
				defaultImageUrl: artworkImages.url,
			})
			.from(postsToArtworks)
			.innerJoin(artworks, eq(postsToArtworks.artworkId, artworks.id))
			.leftJoin(
				artworkImages,
				and(
					eq(artworks.id, artworkImages.artworkId),
					eq(artworkImages.isDefault, true),
				),
			)
			.where(eq(postsToArtworks.postId, post.id)),
		db
			.select({ collection: collections })
			.from(postsToCollections)
			.innerJoin(
				collections,
				eq(postsToCollections.collectionId, collections.id),
			)
			.where(
				and(
					eq(postsToCollections.postId, post.id),
					isNotNull(collections.publishedAt),
				),
			),
	]);

	return {
		...post,
		artworks: artworkRows.map((r) => ({
			id: r.artworkId,
			slug: r.slug,
			title: r.title,
			defaultImageUrl: r.defaultImageUrl,
		})),
		collections: collectionRows.map((r) => ({
			id: r.collection.id,
			slug: r.collection.slug,
			name: r.collection.name,
		})),
	};
}

export async function getAllArtworks(
	env: Env,
): Promise<ArtworkListItem[]> {
	const db = getDb(env);
	const rows = await db
		.select({
			id: artworks.id,
			title: artworks.title,
			slug: artworks.slug,
			description: artworks.description,
			artist: artworks.artist,
			year: artworks.year,
			width: artworks.width,
			height: artworks.height,
			depth: artworks.depth,
			dimensionUnit: artworks.dimensionUnit,
			publishedAt: artworks.publishedAt,
			locale: artworks.locale,
			createdAt: artworks.createdAt,
			updatedAt: artworks.updatedAt,
			defaultImageUrl: artworkImages.url,
		})
		.from(artworks)
		.leftJoin(
			artworkImages,
			and(
				eq(artworks.id, artworkImages.artworkId),
				eq(artworkImages.isDefault, true),
			),
		)
		.where(isNotNull(artworks.publishedAt));
	if (rows.length === 0) return [];

	const collectionRows = await db
		.select({
			artworkId: artworksToCollections.artworkId,
			id: collections.id,
			slug: collections.slug,
			name: collections.name,
		})
		.from(artworksToCollections)
		.innerJoin(
			collections,
			eq(artworksToCollections.collectionId, collections.id),
		)
		.where(
			and(
				inArray(
					artworksToCollections.artworkId,
					rows.map((row) => row.id),
				),
				isNotNull(collections.publishedAt),
			),
		);

	const collectionsByArtworkId = new Map<number, ArtworkCollectionRef[]>();
	for (const row of collectionRows) {
		const current = collectionsByArtworkId.get(row.artworkId) ?? [];
		current.push({
			id: row.id,
			slug: row.slug,
			name: row.name,
		});
		collectionsByArtworkId.set(row.artworkId, current);
	}

	return rows.map((row) => ({
		...row,
		collections: collectionsByArtworkId.get(row.id) ?? [],
	}));
}

export async function getArtworkBySlug(
	env: Env,
	slug: string,
): Promise<ArtworkDetail | null> {
	const db = getDb(env);
	const [artwork] = await db
		.select()
		.from(artworks)
		.where(eq(artworks.slug, slug));
	if (!artwork) return null;

	const [imageRows, junctionRows, productRows] = await Promise.all([
		db
			.select()
			.from(artworkImages)
			.where(eq(artworkImages.artworkId, artwork.id)),
		db
			.select({ collection: collections })
			.from(artworksToCollections)
			.innerJoin(
				collections,
				eq(artworksToCollections.collectionId, collections.id),
			)
			.where(
				and(
					eq(artworksToCollections.artworkId, artwork.id),
					isNotNull(collections.publishedAt),
				),
			),
		db
			.select()
			.from(products)
			.where(
				and(eq(products.artworkId, artwork.id), eq(products.type, "artwork")),
			),
	]);

	const defaultImage = imageRows.find((i) => i.isDefault) ?? imageRows[0];
	return {
		...artwork,
		defaultImageUrl: defaultImage?.url ?? null,
		images: imageRows.map((i) => ({
			url: i.url,
			isDefault: i.isDefault ?? false,
			caption: i.caption,
		})),
		collections: junctionRows.map((r) => r.collection),
		product: productRows[0] ?? null,
	};
}

export async function getAllCollections(
	env: Env,
): Promise<SelectCollection[]> {
	const db = getDb(env);
	return db
		.select()
		.from(collections)
		.where(isNotNull(collections.publishedAt));
}

export async function getCollectionBySlug(
	env: Env,
	slug: string,
): Promise<CollectionWithArtworks | null> {
	const db = getDb(env);
	const [collection] = await db
		.select()
		.from(collections)
		.where(eq(collections.slug, slug));
	if (!collection) return null;

	const rows = await db
		.select({
			id: artworks.id,
			title: artworks.title,
			slug: artworks.slug,
			description: artworks.description,
			artist: artworks.artist,
			year: artworks.year,
			width: artworks.width,
			height: artworks.height,
			depth: artworks.depth,
			dimensionUnit: artworks.dimensionUnit,
			publishedAt: artworks.publishedAt,
			locale: artworks.locale,
			createdAt: artworks.createdAt,
			updatedAt: artworks.updatedAt,
			defaultImageUrl: artworkImages.url,
		})
		.from(artworksToCollections)
		.innerJoin(artworks, eq(artworksToCollections.artworkId, artworks.id))
		.leftJoin(
			artworkImages,
			and(
				eq(artworks.id, artworkImages.artworkId),
				eq(artworkImages.isDefault, true),
			),
		)
		.where(eq(artworksToCollections.collectionId, collection.id));

	return { ...collection, artworks: rows };
}

export async function getAvailableProducts(
	env: Env,
): Promise<ProductWithArtwork[]> {
	const db = getDb(env);
	const rows = await db
		.select()
		.from(products)
		.where(
			or(
				and(eq(products.type, "artwork"), isNull(products.soldAt)),
				gt(products.quantity, 0),
			),
		);
	if (rows.length === 0) return [];

	const artworkIds = rows
		.map((p) => p.artworkId)
		.filter((id): id is number => id !== null);

	const artworkRows = artworkIds.length
		? await db
				.select({
					id: artworks.id,
					title: artworks.title,
					slug: artworks.slug,
					description: artworks.description,
					artist: artworks.artist,
					year: artworks.year,
					width: artworks.width,
					height: artworks.height,
					depth: artworks.depth,
					dimensionUnit: artworks.dimensionUnit,
					publishedAt: artworks.publishedAt,
					locale: artworks.locale,
					createdAt: artworks.createdAt,
					updatedAt: artworks.updatedAt,
					defaultImageUrl: artworkImages.url,
				})
				.from(artworks)
				.leftJoin(
					artworkImages,
					and(
						eq(artworks.id, artworkImages.artworkId),
						eq(artworkImages.isDefault, true),
					),
				)
				.where(inArray(artworks.id, artworkIds))
		: [];

	const artworkById = new Map<number, ArtworkWithDefaultImage>();
	for (const a of artworkRows) artworkById.set(a.id, a);

	return rows.map((p) => ({
		...p,
		artwork: p.artworkId !== null ? (artworkById.get(p.artworkId) ?? null) : null,
	}));
}

export async function getProductAvailabilityBySlug(
	env: Env,
	slug: string,
): Promise<ProductAvailability | null> {
	const db = getDb(env);
	const [product] = await db
		.select({
			slug: products.slug,
			type: products.type,
			soldAt: products.soldAt,
			quantity: products.quantity,
		})
		.from(products)
		.where(eq(products.slug, slug));
	if (!product) return null;

	const isUniqueArtwork = product.type === "artwork";
	const available = isUniqueArtwork
		? product.soldAt === null
		: (product.quantity ?? 0) > 0;

	return {
		slug: product.slug,
		type: product.type,
		available,
		status: available
			? "available"
			: isUniqueArtwork
				? "sold"
				: "out_of_stock",
	};
}

export async function getProductBySlug(
	env: Env,
	slug: string,
): Promise<ProductWithArtwork | null> {
	const db = getDb(env);
	const [product] = await db
		.select()
		.from(products)
		.where(eq(products.slug, slug));
	if (!product) return null;

	let artwork: ArtworkWithDefaultImage | null = null;
	if (product.artworkId !== null) {
		const [row] = await db
			.select({
				id: artworks.id,
				title: artworks.title,
				slug: artworks.slug,
				description: artworks.description,
				artist: artworks.artist,
				year: artworks.year,
				width: artworks.width,
				height: artworks.height,
				depth: artworks.depth,
				dimensionUnit: artworks.dimensionUnit,
				publishedAt: artworks.publishedAt,
				locale: artworks.locale,
				createdAt: artworks.createdAt,
				updatedAt: artworks.updatedAt,
				defaultImageUrl: artworkImages.url,
			})
			.from(artworks)
			.leftJoin(
				artworkImages,
				and(
					eq(artworks.id, artworkImages.artworkId),
					eq(artworkImages.isDefault, true),
				),
			)
			.where(eq(artworks.id, product.artworkId));
		artwork = row ?? null;
	}

	return { ...product, artwork };
}

export async function getHomepageSlides(
	env: Env,
): Promise<ArtworkWithDefaultImage[]> {
	const db = getDb(env);
	return db
		.select({
			id: artworks.id,
			title: artworks.title,
			slug: artworks.slug,
			description: artworks.description,
			artist: artworks.artist,
			year: artworks.year,
			width: artworks.width,
			height: artworks.height,
			depth: artworks.depth,
			dimensionUnit: artworks.dimensionUnit,
			publishedAt: artworks.publishedAt,
			locale: artworks.locale,
			createdAt: artworks.createdAt,
			updatedAt: artworks.updatedAt,
			defaultImageUrl: artworkImages.url,
		})
		.from(homepageArtworks)
		.innerJoin(artworks, eq(homepageArtworks.artworkId, artworks.id))
		.leftJoin(
			artworkImages,
			and(
				eq(artworks.id, artworkImages.artworkId),
				eq(artworkImages.isDefault, true),
			),
		)
		.orderBy(homepageArtworks.position);
}
