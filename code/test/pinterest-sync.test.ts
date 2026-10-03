import { describe, expect, test } from "bun:test";
import { buildPinterestOperations, getPinterestBatchStatus, PinterestSyncError, syncPinterestCatalog } from "../src/lib/pinterest-sync";
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
			[artwork], ["artwork-41", "artwork-42"],
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

	test("uses only catalog endpoints supported by app credentials", async () => {
		const calls: Array<{ url: string; path: string; body: unknown }> = [];
		const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			const path = new URL(url).pathname;
			calls.push({ url, path, body: init?.body && typeof init.body === "string" ? JSON.parse(init.body) : null });
			if (path === "/v5/oauth/token") return Response.json({ access_token: "test-token", scope: "catalogs:read catalogs:write" });
			if (path === "/v5/catalogs/feeds") return Response.json({ items: [] });
			if (path === "/v5/catalogs/items/batch") return Response.json({ batch_id: "b12345", status: "PROCESSING", items: [] });
			throw new Error(`Unexpected Pinterest endpoint: ${path}`);
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456", PINTEREST_AD_ACCOUNT_ID: "789" };
		const result = await syncPinterestCatalog(env, [artwork], ["artwork-41", "artwork-42"], mockFetch);
		expect(result).toMatchObject({ batch_id: "b12345", status: "PROCESSING" });
		expect(calls.map((call) => call.path)).toEqual([
			"/v5/oauth/token", "/v5/catalogs/feeds", "/v5/catalogs/items/batch",
		]);
		expect(calls[1].url).toEndWith("/v5/catalogs/feeds?catalog_id=456&ad_account_id=789");
		expect(calls[2].url).toEndWith("/v5/catalogs/items/batch?ad_account_id=789");
		expect(calls[2].body).toMatchObject({
			items: [
				{ item_id: "artwork-41", operation: "UPSERT", attributes: { price: "250.00 USD" } },
				{ item_id: "artwork-42", operation: "DELETE" },
			],
		});
		expect(calls[2].body).not.toHaveProperty("catalog_id");
	});

	test("routes batch status checks through the catalog owner's ad account", async () => {
		const calls: string[] = [];
		const mockFetch = (async (input: RequestInfo | URL) => {
			calls.push(String(input));
			return Response.json(calls.length === 1
				? { access_token: "test-token", scope: "catalogs:read catalogs:write" }
				: { batch_id: "b12345", status: "COMPLETED", items: [] });
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456", PINTEREST_AD_ACCOUNT_ID: "789" };
		await getPinterestBatchStatus(env, "b12345", mockFetch);
		expect(calls[1]).toBe("https://api.pinterest.com/v5/catalogs/items/batch/b12345?ad_account_id=789");
	});

	test("names the Pinterest operation that denied access", async () => {
		const mockFetch = (async (input: RequestInfo | URL) => {
			const path = new URL(String(input)).pathname;
			if (path === "/v5/oauth/token") return Response.json({ access_token: "test-token", scope: "catalogs:read catalogs:write" });
			return Response.json({ code: 2, message: "Denied" }, { status: 403 });
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456" };
		await expect(syncPinterestCatalog(env, [artwork], ["artwork-41"], mockFetch))
			.rejects.toThrow("Pinterest denied catalog feed check (HTTP 403, code 2): Denied");
	});

	test("shows the batch denial reason without exposing a token", async () => {
		const mockFetch = (async (input: RequestInfo | URL) => {
			const path = new URL(String(input)).pathname;
			if (path === "/v5/oauth/token") return Response.json({ access_token: "test-token", scope: "catalogs:read catalogs:write" });
			if (path === "/v5/catalogs/feeds") return Response.json({ items: [] });
			return Response.json({ code: 29, message: "Account denied for pinc_sensitive123" }, { status: 403 });
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456" };
		await expect(syncPinterestCatalog(env, [artwork], [], mockFetch))
			.rejects.toThrow("Pinterest denied catalog batch write (HTTP 403, code 29): Account denied for [redacted]");
	});

	test("accepts an alphanumeric Pinterest batch ID for status checks", async () => {
		const calls: string[] = [];
		const mockFetch = (async (input: RequestInfo | URL) => {
			calls.push(String(input));
			return Response.json(calls.length === 1
				? { access_token: "test-token", scope: "catalogs:read catalogs:write" }
				: { batch_id: "b12345", status: "COMPLETED", items: [{ item_id: "artwork-41", status: "SUCCESS" }] });
		}) as typeof fetch;
		const env = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456" };
		expect((await getPinterestBatchStatus(env, "b12345", mockFetch)).items[0].status).toBe("SUCCESS");
		expect(calls[1]).toBe("https://api.pinterest.com/v5/catalogs/items/batch/b12345");
	});
});
