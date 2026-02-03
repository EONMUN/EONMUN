"use server";

import {
  findPostsWithRelations,
  type PostWithRelations,
  type SelectPost,
} from "@/models/post";
import type { PostType } from "@/database/schema.posts";

export type { PostWithRelations, SelectPost };

export async function getAllPublishedPosts(postType?: PostType) {
  const allPosts = await findPostsWithRelations({
    published: true,
    postType: postType ? [postType] : undefined,
  });

  return {
    data: allPosts,
    meta: { total: allPosts.length },
  };
}

export async function getPostBySlug(
  slug: string,
): Promise<PostWithRelations | null> {
  const result = await findPostsWithRelations({
    slug: [slug],
    published: true,
  });

  return result[0] || null;
}

export async function getRelatedPostsForArtwork(artworkId: number) {
  const relatedPosts = await findPostsWithRelations({
    published: true,
    artworkId: [artworkId],
  });

  return { data: relatedPosts };
}

export async function getRelatedPostsForCollection(collectionId: number) {
  const relatedPosts = await findPostsWithRelations({
    published: true,
    collectionId: [collectionId],
  });

  return { data: relatedPosts };
}
