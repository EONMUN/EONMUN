import { catalogArtworkFields, type CatalogArtwork } from "./catalog-artwork";

const columns = ["id", "title", "description", "link", "image_link", "price", "availability"];

export function toPinterestCatalogItem(artwork: CatalogArtwork, site: URL) {
	return {
		...catalogArtworkFields(artwork, site),
		image_link: artwork.imageUrl,
		price: `${(artwork.priceCents / 100).toFixed(2)} USD`,
		availability: "in stock",
	};
}

function csv(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}

export function renderPinterestFeed(artworks: CatalogArtwork[], site: URL) {
	const rows = artworks.map((artwork) => {
		const item = toPinterestCatalogItem(artwork, site);
		return columns.map((column) => csv(item[column as keyof typeof item])).join(",");
	});
	return [columns.join(","), ...rows].join("\r\n") + "\r\n";
}
