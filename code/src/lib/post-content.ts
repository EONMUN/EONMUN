import { getCollection, type CollectionEntry } from "astro:content";

import type { PostType } from "../db";
import {
	getStaticArtworksBySlugs,
	getStaticCollectionsBySlugs,
	type StaticArtwork,
	type StaticCollectionRef,
} from "./static-catalog";

export const VALID_POST_TYPES: PostType[] = [
	"announcement",
	"educational",
	"behind_the_scenes",
	"general",
];

export const TYPE_LABELS: Record<PostType, string> = {
	announcement: "Announcements",
	educational: "Educational",
	behind_the_scenes: "Behind the Scenes",
	general: "General",
};

export type PostEntry = CollectionEntry<"posts">;

export interface PublishedPostDetail {
	post: PostEntry;
	artworks: StaticArtwork[];
	collections: StaticCollectionRef[];
}

function parseEntryDate(value: string | null | undefined) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function getPostPublishedDate(post: PostEntry) {
	return parseEntryDate(post.data.publishedAt ?? post.data.scheduledAt);
}

export function getPostPublishedTime(post: PostEntry) {
	return getPostPublishedDate(post)?.toISOString();
}

export function isPublishedPost(post: PostEntry, now = new Date()) {
	const publishedAt = parseEntryDate(post.data.publishedAt);
	if (publishedAt) return true;

	const scheduledAt = parseEntryDate(post.data.scheduledAt);
	return scheduledAt ? scheduledAt <= now : false;
}

export function getPostRelatedArtworks(post: PostEntry) {
	return getStaticArtworksBySlugs(post.data.artworkSlugs);
}

export function getPostRelatedCollections(post: PostEntry) {
	return getStaticCollectionsBySlugs(post.data.collectionSlugs);
}

export function getPostCoverImage(post: PostEntry) {
	return post.data.coverImageUrl ?? getPostRelatedArtworks(post)[0]?.defaultImageUrl ?? null;
}

export async function getPublishedPostEntries(postType?: PostType) {
	const posts = await getCollection("posts");
	return posts
		.filter((post) => isPublishedPost(post))
		.filter((post) => (postType ? post.data.postType === postType : true))
		.sort((left, right) => {
			const leftTime = getPostPublishedDate(left)?.getTime() ?? 0;
			const rightTime = getPostPublishedDate(right)?.getTime() ?? 0;
			return rightTime - leftTime;
		});
}

export async function getPublishedPostDetailBySlug(
	slug: string,
): Promise<PublishedPostDetail | null> {
	const posts = await getPublishedPostEntries();
	const post = posts.find((entry) => entry.id === slug);
	if (!post) return null;

	return {
		post,
		artworks: getPostRelatedArtworks(post),
		collections: getPostRelatedCollections(post),
	};
}
