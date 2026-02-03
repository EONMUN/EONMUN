import { eq, inArray, and, isNotNull, isNull, or, lte } from "drizzle-orm";
import {
  db,
  posts,
  postsToArtworks,
  postsToCollections,
  artworks,
  artworkImages,
  collections,
  type SelectPost as BaseSelectPost,
} from "@/database";
import type { PostType } from "@/database/schema.posts";

export type SelectPost = BaseSelectPost;

export interface PostFilters {
  id?: number[];
  slug?: string[];
  published?: boolean;
  postType?: PostType[];
  locale?: string[];
  artworkId?: number[];
  collectionId?: number[];
}

export interface PostWithRelations extends SelectPost {
  artworks: {
    id: number;
    slug: string;
    title: string;
    defaultImageUrl: string | null;
  }[];
  collections: {
    id: number;
    slug: string;
    name: string;
  }[];
}

export async function findPosts(
  filters: PostFilters = {},
): Promise<SelectPost[]> {
  const conditions = [];

  if (filters.id && filters.id.length > 0) {
    conditions.push(inArray(posts.id, filters.id));
  }

  if (filters.slug && filters.slug.length > 0) {
    conditions.push(inArray(posts.slug, filters.slug));
  }

  if (filters.published === true) {
    const now = new Date();
    conditions.push(
      or(
        isNotNull(posts.publishedAt),
        and(isNotNull(posts.scheduledAt), lte(posts.scheduledAt, now)),
      ),
    );
  } else if (filters.published === false) {
    conditions.push(isNull(posts.publishedAt));
  }

  if (filters.postType && filters.postType.length > 0) {
    conditions.push(inArray(posts.postType, filters.postType));
  }

  if (filters.locale && filters.locale.length > 0) {
    conditions.push(inArray(posts.locale, filters.locale));
  }

  const query = db.select().from(posts);

  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  const results = await query;

  // Promote scheduled posts that have passed their scheduled time
  if (filters.published === true) {
    const now = new Date();
    for (const post of results) {
      if (!post.publishedAt && post.scheduledAt && post.scheduledAt <= now) {
        await db
          .update(posts)
          .set({ publishedAt: post.scheduledAt, updatedAt: new Date() })
          .where(eq(posts.id, post.id));
        post.publishedAt = post.scheduledAt;
      }
    }
  }

  // Sort by publishedAt descending (newest first), drafts by createdAt
  results.sort((a, b) => {
    const dateA = a.publishedAt || a.createdAt;
    const dateB = b.publishedAt || b.createdAt;
    return dateB.getTime() - dateA.getTime();
  });

  return results;
}

export async function findPostsWithRelations(
  filters: PostFilters = {},
): Promise<PostWithRelations[]> {
  let matchedPosts = await findPosts(filters);

  if (matchedPosts.length === 0) {
    return [];
  }

  // If filtering by artworkId, filter posts through junction table
  if (filters.artworkId && filters.artworkId.length > 0) {
    const junctionRows = await db
      .select({ postId: postsToArtworks.postId })
      .from(postsToArtworks)
      .where(inArray(postsToArtworks.artworkId, filters.artworkId));
    const postIds = new Set(junctionRows.map((r) => r.postId));
    matchedPosts = matchedPosts.filter((p) => postIds.has(p.id));
  }

  // If filtering by collectionId, filter posts through junction table
  if (filters.collectionId && filters.collectionId.length > 0) {
    const junctionRows = await db
      .select({ postId: postsToCollections.postId })
      .from(postsToCollections)
      .where(inArray(postsToCollections.collectionId, filters.collectionId));
    const postIds = new Set(junctionRows.map((r) => r.postId));
    matchedPosts = matchedPosts.filter((p) => postIds.has(p.id));
  }

  if (matchedPosts.length === 0) {
    return [];
  }

  const postIds = matchedPosts.map((p) => p.id);

  // Fetch artworks and collections in parallel
  const [artworkJunction, collectionJunction] = await Promise.all([
    db
      .select({
        postId: postsToArtworks.postId,
        artworkId: artworks.id,
        artworkSlug: artworks.slug,
        artworkTitle: artworks.title,
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
      .where(inArray(postsToArtworks.postId, postIds)),
    db
      .select({
        postId: postsToCollections.postId,
        collection: collections,
      })
      .from(postsToCollections)
      .innerJoin(
        collections,
        eq(postsToCollections.collectionId, collections.id),
      )
      .where(inArray(postsToCollections.postId, postIds)),
  ]);

  // Build maps
  const artworksByPostId = new Map<number, PostWithRelations["artworks"]>();
  for (const row of artworkJunction) {
    const existing = artworksByPostId.get(row.postId) || [];
    existing.push({
      id: row.artworkId,
      slug: row.artworkSlug,
      title: row.artworkTitle,
      defaultImageUrl: row.defaultImageUrl,
    });
    artworksByPostId.set(row.postId, existing);
  }

  const collectionsByPostId = new Map<
    number,
    { id: number; slug: string; name: string }[]
  >();
  for (const row of collectionJunction) {
    const existing = collectionsByPostId.get(row.postId) || [];
    existing.push({
      id: row.collection.id,
      slug: row.collection.slug,
      name: row.collection.name,
    });
    collectionsByPostId.set(row.postId, existing);
  }

  return matchedPosts.map((post) => ({
    ...post,
    artworks: artworksByPostId.get(post.id) || [],
    collections: collectionsByPostId.get(post.id) || [],
  }));
}
