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
});
