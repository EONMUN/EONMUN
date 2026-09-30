import { expect, test } from "bun:test";
import { CACHE_TAGS, planPublicContentRefresh, refillPublicContent } from "../src/lib/cache";

test("artwork edits refresh related pages without touching unrelated artwork or posts", () => {
	const plan = planPublicContentRefresh(
		{ kind: "artwork", oldSlug: "old", slug: "new", published: true },
		["related-post"],
	);
	expect(plan.tags).toContain(CACHE_TAGS.artwork("old"));
	expect(plan.tags).toContain(CACHE_TAGS.artwork("new"));
	expect(plan.paths).toEqual([
		"/", "/artworks", "/sitemap.xml", "/artworks/new", "/posts", "/posts/related-post",
	]);
	expect(plan.paths).not.toContain("/sitemap-index.xml");
});

test("collection edits refresh only published member details and related posts", () => {
	const plan = planPublicContentRefresh(
		{ kind: "collection", oldSlug: "old", slug: "new", memberSlugs: ["published", "draft"] },
		["collection-post"],
		["published"],
	);
	expect(plan.tags).toContain(CACHE_TAGS.artwork("draft"));
	expect(plan.paths).toEqual(["/", "/artworks", "/artworks/published", "/posts/collection-post"]);
});

test("admin cache refresh purges only affected tags before filling affected pages", async () => {
	const events: string[] = [];
	await refillPublicContent(
		{ invalidate: async (options) => {
			expect(options).toEqual({ tags: [CACHE_TAGS.home, CACHE_TAGS.artworks, CACHE_TAGS.artwork("edited")] });
			events.push("purge");
		} },
		{ fetch: async (request) => {
			expect(request.headers.has("cookie")).toBe(false);
			events.push(new URL(request.url).pathname);
			return new Response("fresh page");
		} },
		"https://eonmun.com/api/admin/artworks",
		{ tags: [CACHE_TAGS.home, CACHE_TAGS.artworks, CACHE_TAGS.artwork("edited")], paths: ["/", "/artworks", "/artworks/edited"] },
	);
	expect(events).toEqual(["purge", "/", "/artworks", "/artworks/edited"]);
});

test("admin cache refresh does not fetch stale pages when purge fails", async () => {
	let fetched = false;
	await expect(refillPublicContent(
		{ invalidate: async () => { throw new Error("purge failed"); } },
		{ fetch: async () => { fetched = true; return new Response("old page"); } },
		"https://eonmun.com/api/admin/artworks",
		{ tags: [CACHE_TAGS.home], paths: ["/"] },
	)).rejects.toThrow("purge failed");
	expect(fetched).toBe(false);
});
