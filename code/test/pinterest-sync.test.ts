import { describe, expect, test } from "bun:test";
import { buildPinterestOperations, PinterestSyncError, syncPinterestCatalog } from "../src/lib/pinterest-sync";
import type { PinterestCatalogArtwork } from "../src/lib/pinterest-feed";

const artwork: PinterestCatalogArtwork = {
	id: 41,
	slug: "test-work",
	title: "Test work",
	description: "<p>Original artwork</p>",
	imageUrl: "https://images.example.com/work.jpg",
	priceCents: 25000,
};

describe("Pinterest catalog sync", () => {
	test("sends dollars and removes only known works that are no longer for sale", () => {
		const operations = buildPinterestOperations(
			[artwork], ["artwork-41", "artwork-42"], ["artwork-42", "unrelated-item"],
		);
		expect(operations).toHaveLength(2);
		expect(operations[0]).toMatchObject({
			item_id: "artwork-41", operation: "UPSERT",
			attributes: { price: "250.00 USD", image_link: [artwork.imageUrl] },
		});
		expect(operations[1]).toEqual({ item_id: "artwork-42", operation: "DELETE" });
	});

	test("rejects a token missing write scope before sending a batch", async () => {
		const paths: string[] = [];
		const mockFetch = (async (input: RequestInfo | URL) => {
			paths.push(String(input));
			return Response.json({ access_token: "test-token", scope: "catalogs:read" });
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456" };
		await expect(syncPinterestCatalog(env, [artwork], ["artwork-41"], mockFetch))
			.rejects.toThrow(PinterestSyncError);
		expect(paths).toEqual(["https://api.pinterest.com/v5/oauth/token"]);
	});

	test("checks for a feed and existing items before submitting a scoped batch", async () => {
		const calls: Array<{ path: string; body: unknown }> = [];
		const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const path = new URL(String(input)).pathname;
			calls.push({ path, body: init?.body && typeof init.body === "string" ? JSON.parse(init.body) : null });
			if (path === "/v5/oauth/token") return Response.json({ access_token: "test-token", scope: "catalogs:read catalogs:write" });
			if (path === "/v5/catalogs/feeds") return Response.json({ items: [] });
			if (path === "/v5/catalogs/items") return Response.json({ items: [
				{ item_id: "artwork-42", item_response_kind: "retail_item" },
				{ item_id: "artwork-41", item_response_kind: "retail_item_error" },
			] });
			return Response.json({ batch_id: "12345", status: "PROCESSING", items: [] });
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456" };
		const result = await syncPinterestCatalog(env, [artwork], ["artwork-41", "artwork-42"], mockFetch);
		expect(result).toMatchObject({ batch_id: "12345", status: "PROCESSING" });
		expect(calls.map((call) => call.path)).toEqual([
			"/v5/oauth/token", "/v5/catalogs/feeds", "/v5/catalogs/items", "/v5/catalogs/items/batch",
		]);
		expect(calls[3].body).toMatchObject({
			catalog_id: "456",
			items: [
				{ item_id: "artwork-41", operation: "UPSERT", attributes: { price: "250.00 USD" } },
				{ item_id: "artwork-42", operation: "DELETE" },
			],
		});
	});
});
