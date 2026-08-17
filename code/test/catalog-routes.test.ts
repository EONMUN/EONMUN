import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("public catalog routes", () => {
	test("has no Store route or public navigation link", () => {
		expect(existsSync(resolve("src/pages/store/index.astro"))).toBe(false);
		expect(existsSync(resolve("src/pages/store/[slug].astro"))).toBe(false);
		const navbar = readFileSync(resolve("src/components/Navbar.astro"), "utf8");
		expect(navbar).not.toContain("/store");
		expect(navbar).not.toContain("Store");
	});

	test("does not render a price in the public artwork page or purchase component", () => {
		const publicSource = [
			readFileSync(resolve("src/pages/artworks/[slug].astro"), "utf8"),
			readFileSync(resolve("src/components/PurchaseState.astro"), "utf8"),
		].join("\n");
		expect(publicSource).not.toMatch(/price|amount|unit_amount/i);
	});

	test("keeps private products out of public artwork queries and debug output", () => {
		const publicDataSource = [
			readFileSync(resolve("src/db/queries.ts"), "utf8"),
			readFileSync(resolve("src/lib/artwork-content.ts"), "utf8"),
			readFileSync(resolve("src/pages/debug/errors.astro"), "utf8"),
		].join("\n");
		expect(publicDataSource).not.toMatch(/products?\.price|priceCents|SelectProduct|getAvailableProducts/);
		expect(publicDataSource).not.toMatch(/from\(products\)|productRows/);
	});

	test("homepage uses dynamic timing and respects reduced motion", () => {
		const homepage = readFileSync(resolve("src/pages/index.astro"), "utf8");
		expect(homepage).toContain("getCarouselTiming(slides.length)");
		expect(homepage).toContain("prefers-reduced-motion: reduce");
		expect(homepage).not.toContain("Four-slide carousel");
	});
});
