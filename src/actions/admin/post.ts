"use server";

import { revalidatePath } from "next/cache";
import { db, posts, postsToArtworks, postsToCollections } from "@/database";
import type { InsertPost } from "@/database/schema.posts";
import { eq } from "drizzle-orm";
import { guardAuth, guardAdmin } from "@/lib/actions";
import {
  findPosts,
  findPostsWithRelations,
  type SelectPost,
  type PostWithRelations,
} from "@/models/post";
import { generateSlug } from "@/lib/utils";

export type { SelectPost, PostWithRelations };

export async function getAllPostsAdmin() {
  const authError = await guardAuth();
  if (authError) return authError;

  try {
    const allPosts = await findPostsWithRelations({});
    return { data: allPosts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

export async function getPostBySlugAdmin(slug: string) {
  const authError = await guardAuth();
  if (authError) return null;

  try {
    const result = await findPostsWithRelations({ slug: [slug] });
    return result[0] || null;
  } catch (error) {
    console.error("Error fetching post:", error);
    throw error;
  }
}

export async function createPostAdmin(
  data: Omit<InsertPost, "id" | "createdAt" | "updatedAt"> & {
    artworkIds?: number[];
    collectionIds?: number[];
  },
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const { artworkIds, collectionIds, ...postData } = data;

    // Generate slug if not provided
    if (!postData.slug) {
      postData.slug = generateSlug(postData.title);
    }

    // Check for duplicate slug
    const existing = await findPosts({ slug: [postData.slug] });
    if (existing.length > 0) {
      return {
        success: false,
        error: `A post with slug "${postData.slug}" already exists`,
      };
    }

    const [post] = await db.insert(posts).values(postData).returning();

    // Set artwork associations
    if (artworkIds && artworkIds.length > 0) {
      await db.insert(postsToArtworks).values(
        artworkIds.map((artworkId) => ({
          postId: post.id,
          artworkId,
        })),
      );
    }

    // Set collection associations
    if (collectionIds && collectionIds.length > 0) {
      await db.insert(postsToCollections).values(
        collectionIds.map((collectionId) => ({
          postId: post.id,
          collectionId,
        })),
      );
    }

    revalidatePath("/admin/posts");
    revalidatePath("/posts");
    return { success: true, data: post };
  } catch (error) {
    console.error("Error creating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
}

export async function updatePostAdmin(
  id: number,
  data: Partial<Omit<InsertPost, "id" | "createdAt" | "updatedAt">> & {
    artworkIds?: number[];
    collectionIds?: number[];
  },
) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    const { artworkIds, collectionIds, ...postData } = data;

    // Check for duplicate slug if slug is being changed
    if (postData.slug) {
      const existing = await findPosts({ slug: [postData.slug] });
      if (existing.length > 0 && existing[0].id !== id) {
        return {
          success: false,
          error: `A post with slug "${postData.slug}" already exists`,
        };
      }
    }

    const [post] = await db
      .update(posts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    // Update artwork associations (delete all, re-insert)
    if (artworkIds !== undefined) {
      await db.delete(postsToArtworks).where(eq(postsToArtworks.postId, id));
      if (artworkIds.length > 0) {
        await db.insert(postsToArtworks).values(
          artworkIds.map((artworkId) => ({
            postId: id,
            artworkId,
          })),
        );
      }
    }

    // Update collection associations (delete all, re-insert)
    if (collectionIds !== undefined) {
      await db
        .delete(postsToCollections)
        .where(eq(postsToCollections.postId, id));
      if (collectionIds.length > 0) {
        await db.insert(postsToCollections).values(
          collectionIds.map((collectionId) => ({
            postId: id,
            collectionId,
          })),
        );
      }
    }

    revalidatePath("/admin/posts");
    revalidatePath("/posts");
    revalidatePath(`/posts/${post.slug}`);
    return { success: true, data: post };
  } catch (error) {
    console.error("Error updating post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
    };
  }
}

export async function deletePostAdmin(id: number) {
  const authError = await guardAdmin();
  if (authError) return authError;

  try {
    await db.delete(posts).where(eq(posts.id, id));
    revalidatePath("/admin/posts");
    revalidatePath("/posts");
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}

export async function getArtworksForPostAdmin(postId: number) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const rows = await db
      .select({ artworkId: postsToArtworks.artworkId })
      .from(postsToArtworks)
      .where(eq(postsToArtworks.postId, postId));
    return { data: rows.map((r) => r.artworkId) };
  } catch (error) {
    console.error("Error fetching artworks for post:", error);
    return { data: [] };
  }
}

export async function getCollectionsForPostAdmin(postId: number) {
  const authError = await guardAuth();
  if (authError) return { data: [] };

  try {
    const rows = await db
      .select({ collectionId: postsToCollections.collectionId })
      .from(postsToCollections)
      .where(eq(postsToCollections.postId, postId));
    return { data: rows.map((r) => r.collectionId) };
  } catch (error) {
    console.error("Error fetching collections for post:", error);
    return { data: [] };
  }
}
