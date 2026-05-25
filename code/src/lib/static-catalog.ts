import catalogData from "../data/catalog.generated";

export interface StaticCollectionRef {
	name: string;
	slug: string;
	description: string | null;
	publishedAt: string;
	locale: string;
}

export interface StaticArtworkImage {
	url: string;
	isDefault: boolean;
	caption: string | null;
}

export interface StaticArtwork {
	title: string;
	slug: string;
	description: string | null;
	artist: string | null;
	year: number | null;
	publishedAt: string;
	locale: string;
	images: StaticArtworkImage[];
	defaultImageUrl: string | null;
	collections: StaticCollectionRef[];
}

export interface StaticProduct {
	type: string;
	artworkSlug: string | null;
	name: string;
	slug: string;
	description: string | null;
	imageUrl: string | null;
	price: number;
	quantity: number | null;
}

export interface StaticArtworkDetail extends StaticArtwork {
	product: StaticProduct | null;
}

export interface StaticProductDetail extends StaticProduct {
	artwork: StaticArtwork | null;
}

interface CatalogData {
	collections: StaticCollectionRef[];
	artworks: StaticArtwork[];
	products: StaticProduct[];
	homepage: StaticArtwork[];
}

const catalog: CatalogData = catalogData;

const productByArtworkSlug = new Map(
	catalog.products
		.flatMap((product) =>
			product.artworkSlug !== null ? [[product.artworkSlug, product] as const] : [],
		),
);

const artworkBySlug = new Map(
	catalog.artworks.map((artwork) => [artwork.slug, artwork]),
);

export function getStaticArtworkDetails(): StaticArtworkDetail[] {
	return catalog.artworks.map((artwork) => ({
		...artwork,
		product: productByArtworkSlug.get(artwork.slug) ?? null,
	}));
}

export function getStaticProductDetails(): StaticProductDetail[] {
	return catalog.products.map((product) => ({
		...product,
		artwork:
			product.artworkSlug !== null
				? artworkBySlug.get(product.artworkSlug) ?? null
				: null,
	}));
}

export function getStaticHomepageSlides(): StaticArtwork[] {
	return catalog.homepage;
}
