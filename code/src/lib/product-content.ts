import { getCollection, type CollectionEntry } from "astro:content";

export type ProductEntry = CollectionEntry<"products">;

function parseEntryDate(value: string | null | undefined) {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function getProductPublishedDate(product: ProductEntry) {
	return parseEntryDate(product.data.publishedAt);
}

export function getProductPublishedTime(product: ProductEntry) {
	return getProductPublishedDate(product)?.toISOString();
}

export function isPublishedProduct(product: ProductEntry, now = new Date()) {
	const publishedAt = getProductPublishedDate(product);
	return publishedAt ? publishedAt <= now : false;
}

export async function getPublishedProductEntries() {
	const products = await getCollection("products");
	return products
		.filter((product) => isPublishedProduct(product))
		.sort((left, right) => {
			const leftTime = getProductPublishedDate(left)?.getTime() ?? 0;
			const rightTime = getProductPublishedDate(right)?.getTime() ?? 0;

			if (leftTime !== rightTime) {
				return rightTime - leftTime;
			}

			return left.data.name.localeCompare(right.data.name);
		});
}

export async function getPublishedProductBySlug(slug: string) {
	const products = await getPublishedProductEntries();
	return products.find((product) => product.id === slug) ?? null;
}

export async function getPublishedProductByArtworkSlug(artworkSlug: string) {
	const products = await getPublishedProductEntries();
	return products.find((product) => product.data.artworkSlug === artworkSlug) ?? null;
}
