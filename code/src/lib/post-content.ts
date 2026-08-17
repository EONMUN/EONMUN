import { getCollection, type CollectionEntry } from "astro:content";

import type { PostType } from "../db";
import {
	getPublishedArtworkEntries,
	type PublishedArtworkDetail,
} from "./artwork-content";
import {
	getPublishedCollectionsBySlugs,
	type PublicCollectionRef,
} from "./collection-content";
import { selectRelatedBySlug } from "./public-catalog";

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
	artworks: PublishedArtworkDetail[];
	collections: PublicCollectionRef[];
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

export async function getPostRelatedArtworks(post: PostEntry) {
	const artworks = await getPublishedArtworkEntries();
	return selectRelatedBySlug(post.data.artworkSlugs, artworks, (detail) => detail.artwork.id);
}

export function getPostRelatedCollections(post: PostEntry) {
	return getPublishedCollectionsBySlugs(post.data.collectionSlugs);
}

// Listing pages resolve covers for many posts at once; fetching the artwork
// catalog per post would be one query pair per row on every request.
export async function getPostCoverImages(posts: PostEntry[]) {
	const artworks = await getPublishedArtworkEntries();
	return posts.map((post) => {
		const related = selectRelatedBySlug(
			post.data.artworkSlugs,
			artworks,
			(detail) => detail.artwork.id,
		)[0];
		return post.data.coverImageUrl ?? related?.defaultImageUrl ?? null;
	});
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

	const [artworks, collections] = await Promise.all([
		getPostRelatedArtworks(post),
		getPostRelatedCollections(post),
	]);
	return { post, artworks, collections };
}
