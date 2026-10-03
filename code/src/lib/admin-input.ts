import { artworkAttributes, type ArtworkAttributes, type ArtworkMeasurements } from "./artwork-facets";
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
	if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) throw new Error(`${field} must be a number`);
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

export interface ArtworkAdminInput extends ArtworkAttributes, ArtworkMeasurements {
	title: string;
	slug: string;
	description: string | null;
	tags: string[];
	orientation: string | null;
	artist: string | null;
	year: number | null;
	published: boolean;
	available: boolean;
	priceCents: number | null;
	collectionIds: number[];
	images: { url: string; caption: string | null; altText: string | null; isDefault: boolean }[];
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
		return { url, caption: text(image.caption, "Caption"), altText: text(image.altText, "Alt text"), isDefault: image.isDefault === true };
	});
	if (images.filter((image) => image.isDefault).length > 1) throw new Error("Only one image can be the default");
	if (images.length > 0 && !images.some((image) => image.isDefault)) images[0].isDefault = true;
	const tags = Array.isArray(input.tags) ? input.tags.map((tag) => text(tag, "Tag", true)!) : [];
	if (tags.length > 12 || tags.some((tag) => tag.length > 40 || !slugify(tag))) throw new Error("Tags must be 12 short names or fewer");

    const attributes = Object.fromEntries(artworkAttributes.map(({ name, label }) => {
        const values = input[name] ?? [];
        if (!Array.isArray(values)) throw new Error(`${label} must be a list`);
        const names = values.map(value => text(value, label, true)!);
        if (names.length > 20 || names.some(value => value.length > 80)) throw new Error(`${label} must contain at most 20 short names`);
        return [name, [...new Map(names.map(value => [value.toLowerCase(), value])).values()]];
    })) as ArtworkAttributes;
    const dimensionUnit = input.dimensionUnit ?? 'in';
    if (dimensionUnit !== 'in' && dimensionUnit !== 'cm') throw new Error('Choose inches or centimeters');
    const orientation = text(input.orientation, 'Orientation');
    if (orientation && orientation.length > 80) throw new Error('Orientation must be a short name');

	return {
		title,
		slug,
		description: text(input.description, "Description"),
		tags: [...new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values()],
        ...attributes,
        width: optionalNumber(input.width, 'Width'),
        height: optionalNumber(input.height, 'Height'),
        depth: optionalNumber(input.depth, 'Depth'),
        dimensionUnit, orientation,
		artist: text(input.artist, "Artist"),
		year,
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

export interface CollectionParseOptions {
	// CRITICAL: opt-in, and only for creation. A collection's slug is its public
	// URL. If an update could derive one, a body that carried a renamed `name`
	// and no slug key would silently move a published collection's address
	// instead of being rejected.
	deriveSlug?: boolean;
}

export function parseCollectionInput(value: unknown, options: CollectionParseOptions = {}): CollectionAdminInput {
	if (!value || typeof value !== "object") throw new Error("Invalid collection payload");
	const input = value as Record<string, unknown>;
	const name = text(input.name, "Name", true)!;
	// The artwork editor's inline creator asks for a name only. An empty slug
	// string is still an error either way, so the collection form keeps telling
	// an editor who cleared the field that it is required.
	const derived = options.deriveSlug === true && (input.slug === undefined || input.slug === null);
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

export function isCurrentArtworkEditor(value: unknown): boolean {
    if (!value || typeof value !== "object") return false;
    const input = value as Record<string, unknown>;
    return input.editorVersion === 2 && [input.tags, ...artworkAttributes.map(field => input[field.name])].every(Array.isArray);
}
