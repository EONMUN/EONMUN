import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";

import {
	artworks,
	getDb,
	products,
	type Env,
} from "./index";
import type { CheckoutItem } from "../lib/checkout";
import type { InventoryRecord } from "../lib/inventory";

export async function getInventoryRecordByArtworkSlug(
	env: Env,
	artworkSlug: string,
	db = getDb(env),
): Promise<InventoryRecord | null> {
	const [row] = await db.select({
		artworkSlug: artworks.slug,
		publishedAt: artworks.publishedAt,
		quantity: products.quantity,
		soldAt: products.soldAt,
	}).from(artworks).leftJoin(
		products,
		and(eq(products.artworkId, artworks.id), eq(products.type, "artwork")),
	).where(eq(artworks.slug, artworkSlug));
	if (!row) return null;
	return {
		artworkSlug: row.artworkSlug,
		published: row.publishedAt !== null,
		available: (row.quantity ?? 0) > 0,
		sold: row.soldAt !== null,
	};
}

export async function getCheckoutItemByArtworkSlug(
	env: Env,
	artworkSlug: string,
	db = getDb(env),
): Promise<CheckoutItem | null> {
	const [row] = await db.select({
		artworkSlug: artworks.slug,
		name: artworks.title,
		priceCents: products.price,
		productId: products.id,
	}).from(artworks).innerJoin(
		products,
		and(eq(products.artworkId, artworks.id), eq(products.type, "artwork")),
	).where(and(
		eq(artworks.slug, artworkSlug),
		isNotNull(artworks.publishedAt),
		gt(products.quantity, 0),
		isNull(products.soldAt),
	));
	return row ?? null;
}
