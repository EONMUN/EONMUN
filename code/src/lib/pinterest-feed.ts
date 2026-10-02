export interface PinterestCatalogArtwork {
	id: number;
	slug: string;
	title: string;
	description: string;
	imageUrl: string;
	priceCents: number;
}

const columns = ["id", "title", "description", "link", "image_link", "price", "availability"];

function csv(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}

export function renderPinterestFeed(artworks: PinterestCatalogArtwork[], site: URL) {
	const rows = artworks.map((artwork) => [
		`artwork-${artwork.id}`,
		artwork.title,
		artwork.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
		new URL(`/artworks/${encodeURIComponent(artwork.slug)}`, site).toString(),
		artwork.imageUrl,
		`${(artwork.priceCents / 100).toFixed(2)} USD`,
		"in stock",
	].map(csv).join(","));
	return [columns.join(","), ...rows].join("\r\n") + "\r\n";
}
