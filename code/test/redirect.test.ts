import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { redirectResponse } from "../src/lib/redirect";

const SOURCE_ROOT = path.join(import.meta.dir, "..", "src");

async function sourceFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(entries.map(async (entry) => {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(full);
		return /\.(ts|astro|mjs)$/.test(entry.name) ? [full] : [];
	}));
	return files.flat();
}

describe("redirects", () => {
	test("sets location and keeps headers mutable", () => {
		const response = redirectResponse(new URL("https://eonmun.test/api/auth/signin"), 302);
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://eonmun.test/api/auth/signin");
		response.headers.set("x-astro-middleware", "1");
		expect(response.headers.get("x-astro-middleware")).toBe("1");
	});

	// Response.redirect() returns a response whose headers are immutable. Astro
	// sets headers on whatever a route returns, so on workerd that pairing throws
	// "Can't modify immutable headers" and the redirect reaches the browser as a
	// 500 — which took every /admin route and the Stripe hand-off down in
	// production. Bun does not enforce header immutability, so no assertion on a
	// response object can reproduce it; this test bans the constructor instead.
	// Astro.redirect() inside a .astro page is fine and stays allowed.
	test("no source file returns Response.redirect", async () => {
		const offenders: string[] = [];
		for (const file of await sourceFiles(SOURCE_ROOT)) {
			const contents = await readFile(file, "utf8");
			// Comment lines may name the banned call while explaining the ban.
			const code = contents
				.split("\n")
				.filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
				.join("\n");
			if (code.includes("Response.redirect(")) {
				offenders.push(path.relative(SOURCE_ROOT, file));
			}
		}
		expect(offenders).toEqual([]);
	});
});
