import { describe, expect, test } from "bun:test";
import { parseArtworkInput, parseCollectionInput } from "../src/lib/admin-input";

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

	test("normalizes one default image", () => {
		const result = parseArtworkInput({ ...artwork, images: [
			{ url: "https://r2.eonmun.com/artwork-media/a.jpg", caption: "Front", isDefault: false },
			{ url: "https://r2.eonmun.com/artwork-media/b.jpg", caption: null, isDefault: false },
		] });
		expect(result.images.map((image) => image.isDefault)).toEqual([true, false]);
	});
});
