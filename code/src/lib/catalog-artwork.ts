import { SITE_URL } from "../consts";

export interface CatalogArtwork {
	id: number;
	slug: string;
	title: string;
	description: string;
	imageUrl: string;
	priceCents: number;
}

export function catalogArtworkFields(artwork: CatalogArtwork, site: URL = new URL(SITE_URL)) {
	return {
		id: `artwork-${artwork.id}`,
		title: artwork.title,
		description: artwork.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
		link: new URL(`/artworks/${encodeURIComponent(artwork.slug)}`, site).toString(),
	};
}
