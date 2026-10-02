import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { artworkImages, artworks, getDb, products, type Env } from "./index";

export async function getAvailableArtworkCatalog(env: Env, db = getDb(env)) {
	const rows = await db.select({
		id: artworks.id,
		slug: artworks.slug,
		title: artworks.title,
		description: artworks.description,
		productDescription: products.description,
		imageUrl: artworkImages.url,
		priceCents: products.price,
	}).from(artworks).innerJoin(products, and(
		eq(products.artworkId, artworks.id),
		eq(products.type, "artwork"),
	)).leftJoin(artworkImages, and(
		eq(artworkImages.artworkId, artworks.id),
		eq(artworkImages.isDefault, true),
	)).where(and(
		isNotNull(artworks.publishedAt),
		gt(products.price, 0),
		gt(products.quantity, 0),
		isNull(products.soldAt),
	));

	return rows.map((row) => ({
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description || row.productDescription || `Original artwork by EONMUN: ${row.title}`,
		imageUrl: row.imageUrl,
		priceCents: row.priceCents,
	})).filter((row): row is typeof row & { imageUrl: string } => {
		if (!row.imageUrl) return false;
		try { return new URL(row.imageUrl).protocol === "https:"; } catch { return false; }
	});
}
