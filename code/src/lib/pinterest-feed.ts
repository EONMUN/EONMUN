export interface PinterestCatalogArtwork {
	id: number;
	slug: string;
	title: string;
	description: string;
	imageUrl: string;
	priceCents: number;
}

const columns = ["id", "title", "description", "link", "image_link", "price", "availability"];

export function toPinterestCatalogItem(artwork: PinterestCatalogArtwork, site: URL) {
	return {
		id: `artwork-${artwork.id}`,
		title: artwork.title,
		description: artwork.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
		link: new URL(`/artworks/${encodeURIComponent(artwork.slug)}`, site).toString(),
		image_link: artwork.imageUrl,
		price: `${(artwork.priceCents / 100).toFixed(2)} USD`,
		availability: "in stock",
	};
}

function csv(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}

export function renderPinterestFeed(artworks: PinterestCatalogArtwork[], site: URL) {
	const rows = artworks.map((artwork) => {
		const item = toPinterestCatalogItem(artwork, site);
		return columns.map((column) => csv(item[column as keyof typeof item])).join(",");
	});
	return [columns.join(","), ...rows].join("\r\n") + "\r\n";
}
