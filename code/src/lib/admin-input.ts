import { R2_PUBLIC_ORIGIN } from "./media";
import { SLUG_PATTERN, slugify } from "./slug";

function text(value: unknown, field: string, required = false) {
	if (typeof value !== "string") {
		if (!required && (value === null || value === undefined)) return null;
		throw new Error(`${field} must be text`);
	}
	const normalized = value.trim();
	if (required && !normalized) throw new Error(`${field} is required`);
	return normalized || null;
}

function optionalNumber(value: unknown, field: string) {
	if (value === "" || value === null || value === undefined) return null;
	const number = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number`);
	return number;
}

function ids(value: unknown, field: string) {
	if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
	const parsed = value.map(Number);
	if (parsed.some((id) => !Number.isInteger(id) || id <= 0)) throw new Error(`${field} contains an invalid ID`);
	return [...new Set(parsed)];
}

export interface ArtworkAdminInput {
	title: string;
	slug: string;
	description: string | null;
	artist: string | null;
	year: number | null;
	width: number | null;
	height: number | null;
	depth: number | null;
	dimensionUnit: string;
	published: boolean;
	available: boolean;
	priceCents: number | null;
	collectionIds: number[];
	images: { url: string; caption: string | null; isDefault: boolean }[];
}

export function parseArtworkInput(value: unknown): ArtworkAdminInput {
	if (!value || typeof value !== "object") throw new Error("Invalid artwork payload");
	const input = value as Record<string, unknown>;
	const title = text(input.title, "Title", true)!;
	const slug = text(input.slug, "Slug", true)!;
	if (!SLUG_PATTERN.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and hyphens");
	const year = optionalNumber(input.year, "Year");
	if (year !== null && (!Number.isInteger(year) || year < 1000 || year > 9999)) throw new Error("Year is invalid");
	const available = input.available === true;
	const priceCents = optionalNumber(input.priceCents, "Private price");
	if (priceCents !== null && !Number.isInteger(priceCents)) throw new Error("Private price must be whole cents");
	if (available && (priceCents === null || priceCents <= 0)) throw new Error("A private price is required when artwork is available");
	if (!Array.isArray(input.images)) throw new Error("Images must be an array");
	const images = input.images.map((raw) => {
		if (!raw || typeof raw !== "object") throw new Error("Invalid image");
		const image = raw as Record<string, unknown>;
		const url = text(image.url, "Image URL", true)!;
		const parsed = new URL(url);
		if (parsed.origin !== R2_PUBLIC_ORIGIN) throw new Error("Image URL must use the EONMUN media domain");
		return { url, caption: text(image.caption, "Caption"), isDefault: image.isDefault === true };
	});
	if (images.filter((image) => image.isDefault).length > 1) throw new Error("Only one image can be the default");
	if (images.length > 0 && !images.some((image) => image.isDefault)) images[0].isDefault = true;
	return {
		title,
		slug,
		description: text(input.description, "Description"),
		artist: text(input.artist, "Artist"),
		year,
		width: optionalNumber(input.width, "Width"),
		height: optionalNumber(input.height, "Height"),
		depth: optionalNumber(input.depth, "Depth"),
		dimensionUnit: text(input.dimensionUnit, "Dimension unit") ?? "in",
		published: input.published === true,
		available,
		priceCents,
		collectionIds: ids(input.collectionIds ?? [], "Collections"),
		images,
	};
}

export interface CollectionAdminInput {
	name: string;
	slug: string;
	description: string | null;
	published: boolean;
	artworkIds: number[];
	defaultArtworkId: number | null;
}

export function parseCollectionInput(value: unknown): CollectionAdminInput {
	if (!value || typeof value !== "object") throw new Error("Invalid collection payload");
	const input = value as Record<string, unknown>;
	const name = text(input.name, "Name", true)!;
	// A caller that omits the slug key entirely -- the artwork editor's inline
	// creator, which asks for a name only -- gets one derived from the name. An
	// empty slug string is still an error, so the collection form keeps telling
	// an editor who cleared the field that it is required.
	const derived = input.slug === undefined || input.slug === null;
	const slug = derived ? slugify(name) : text(input.slug, "Slug", true)!;
	if (derived && !slug) throw new Error("Name must contain letters or numbers");
	if (!SLUG_PATTERN.test(slug)) throw new Error("Slug must use lowercase letters, numbers, and hyphens");
	const artworkIds = ids(input.artworkIds ?? [], "Artworks");
	const defaultArtworkId = input.defaultArtworkId == null || input.defaultArtworkId === ""
		? null
		: Number(input.defaultArtworkId);
	if (defaultArtworkId !== null && (!Number.isInteger(defaultArtworkId) || !artworkIds.includes(defaultArtworkId))) {
		throw new Error("The collection cover must be an artwork in the collection");
	}
	return {
		name,
		slug,
		description: text(input.description, "Description"),
		published: input.published === true,
		artworkIds,
		defaultArtworkId,
	};
}
