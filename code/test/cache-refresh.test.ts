import { expect, test } from "bun:test";
import { PUBLIC_CONTENT_TAG, refillPublicContent } from "../src/lib/cache";

test("admin cache refresh purges before filling public pages", async () => {
	const events: string[] = [];
	await refillPublicContent(
		{ invalidate: async (options) => {
			expect(options).toEqual({ tags: [PUBLIC_CONTENT_TAG] });
			events.push("purge");
		} },
		{ fetch: async (request) => {
			expect(request.headers.has("cookie")).toBe(false);
			events.push(new URL(request.url).pathname);
			return new Response("fresh page");
		} },
		"https://eonmun.com/api/admin/artworks",
		async () => { events.push("discover"); return ["/", "/artworks"]; },
	);
	expect(events).toEqual(["purge", "discover", "/", "/artworks"]);
});

test("admin cache refresh does not fetch stale pages when purge fails", async () => {
	let fetched = false;
	await expect(refillPublicContent(
		{ invalidate: async () => { throw new Error("purge failed"); } },
		{ fetch: async () => { fetched = true; return new Response("old page"); } },
		"https://eonmun.com/api/admin/artworks",
		async () => ["/"],
	)).rejects.toThrow("purge failed");
	expect(fetched).toBe(false);
});
