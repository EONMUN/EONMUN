import { describe, expect, test } from "bun:test";
import { parseArtworkInput, parseCollectionInput } from "../src/lib/admin-input";
import { SLUG_PATTERN, slugify } from "../src/lib/slug";

const artwork = {
	title: "New work",
	slug: "new-work",
	description: "Study",
	artist: "EONMUN",
	year: 2026,
	width: 12,
	height: 16,
	depth: "",
	dimensionUnit: "in",
	published: true,
	available: false,
	priceCents: "",
	collectionIds: [],
	images: [],
};

describe("admin input", () => {
	test("requires a private price only when available", () => {
		expect(() => parseArtworkInput({ ...artwork, available: true })).toThrow("private price");
		expect(parseArtworkInput({ ...artwork, available: true, priceCents: 125000 }).priceCents).toBe(125000);
	});

	test("rejects slug conflicts before database access", () => {
		expect(() => parseArtworkInput({ ...artwork, slug: "Not Valid" })).toThrow("Slug");
	});

	test("validates collection cover membership", () => {
		expect(() => parseCollectionInput({ name: "Group", slug: "group", artworkIds: [1], defaultArtworkId: 2 })).toThrow("cover");
	});

	test("derives a collection slug when the caller sends a name only", () => {
		const result = parseCollectionInput({ name: "  Winter Étude 2026!  ", artworkIds: [] });
		expect(result.slug).toBe("winter-etude-2026");
		expect(result.name).toBe("Winter Étude 2026!");
		expect(SLUG_PATTERN.test(result.slug)).toBe(true);
	});

	test("still requires a slug the caller sent as an empty string", () => {
		expect(() => parseCollectionInput({ name: "Group", slug: "", artworkIds: [] })).toThrow("Slug is required");
	});

	test("rejects a name that cannot produce a slug", () => {
		expect(() => parseCollectionInput({ name: "!!!", artworkIds: [] })).toThrow("Name must contain letters or numbers");
	});

	test("slugify keeps the shape the slug pattern demands", () => {
		expect(slugify("Two  --  Words")).toBe("two-words");
		expect(slugify("-leading and trailing-")).toBe("leading-and-trailing");
		expect(slugify("")).toBe("");
	});

	test("normalizes one default image", () => {
		const result = parseArtworkInput({ ...artwork, images: [
			{ url: "https://r2.eonmun.com/artwork-media/a.jpg", caption: "Front", isDefault: false },
			{ url: "https://r2.eonmun.com/artwork-media/b.jpg", caption: null, isDefault: false },
		] });
		expect(result.images.map((image) => image.isDefault)).toEqual([true, false]);
	});
});
