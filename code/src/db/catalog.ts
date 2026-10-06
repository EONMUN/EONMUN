import { and, asc, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { artworkImages, artworks, getDb, products, type Env } from "./index";

export async function getAvailableArtworkCatalog(env: Env, db = getDb(env), artworkId?: number) {
	const rows = await db.select({
		id: artworks.id,
		slug: artworks.slug,
		title: artworks.title,
		description: artworks.description,
		productDescription: products.description,
		imageUrl: artworkImages.url,
		isDefault: artworkImages.isDefault,
		priceCents: products.price,
	}).from(artworks).innerJoin(products, and(
		eq(products.artworkId, artworks.id),
		eq(products.type, "artwork"),
	)).leftJoin(artworkImages, eq(artworkImages.artworkId, artworks.id)).where(and(
		isNotNull(artworks.publishedAt),
		gt(products.price, 0),
		gt(products.quantity, 0),
		isNull(products.soldAt),
		artworkId === undefined ? undefined : eq(artworks.id, artworkId),
	)).orderBy(asc(artworkImages.id));

	const images = new Map<number, string[]>();
	for (const row of rows) {
		if (!row.imageUrl || row.isDefault) continue;
		try { if (new URL(row.imageUrl).protocol !== "https:") continue; } catch { continue; }
		const urls = images.get(row.id) ?? [];
		urls.push(row.imageUrl);
		images.set(row.id, urls);
	}

	return rows.filter((row) => row.isDefault).map((row) => ({
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description || row.productDescription || `Original artwork by EONMUN: ${row.title}`,
		imageUrl: row.imageUrl,
		additionalImageUrls: [...new Set(images.get(row.id) ?? [])].filter((url) => url !== row.imageUrl),
		priceCents: row.priceCents,
	})).filter((row): row is typeof row & { imageUrl: string } => {
		if (!row.imageUrl) return false;
		try { return new URL(row.imageUrl).protocol === "https:"; } catch { return false; }
	});
}

export async function getAvailableArtworkById(env: Env, artworkId: number) {
	return (await getAvailableArtworkCatalog(env, getDb(env), artworkId))[0] ?? null;
}

export async function getArtworkCatalogIds(env: Env, db = getDb(env)) {
	return (await db.select({ id: artworks.id }).from(artworks)).map((row) => `artwork-${row.id}`);
}
