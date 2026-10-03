import { describe, expect, test } from "bun:test";
import { googleProductInput, syncGoogleArtwork, syncGoogleCatalog } from "../src/lib/google-merchant";
import type { PinterestCatalogArtwork } from "../src/lib/pinterest-feed";

const artwork: PinterestCatalogArtwork = {
	id: 41, slug: "elephants-bw", title: "Elephants B&W", description: "Original <b>artwork</b>",
	imageUrl: "https://images.example.com/artwork.jpg", priceCents: 25000,
};

async function testEnv() {
	const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
	const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
	const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...pkcs8))}\n-----END PRIVATE KEY-----`;
	return {
		GOOGLE_MERCHANT_ACCOUNT_ID: "123",
		GOOGLE_MERCHANT_DATA_SOURCE_ID: "456",
		GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "merchant@example.com", private_key: pem }),
	};
}

describe("Google Merchant sync", () => {
	test("maps cents to USD micros for a one-of-a-kind artwork", () => {
		expect(googleProductInput(artwork)).toMatchObject({
			offerId: "artwork-41", contentLanguage: "en", feedLabel: "US",
			productAttributes: {
				price: { amountMicros: "250000000", currencyCode: "USD" },
				identifierExists: false, availability: "IN_STOCK", condition: "NEW",
				link: "https://eonmun.com/artworks/elephants-bw", description: "Original artwork",
			},
		});
	});

	test("submits a saleable product and removes it after sale", async () => {
		const env = await testEnv();
		const requests: Array<{ url: string; method: string; body?: unknown }> = [];
		const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			requests.push({ url, method: init?.method ?? "GET", body: init?.body instanceof URLSearchParams ? Object.fromEntries(init.body) : typeof init?.body === "string" ? JSON.parse(init.body) : undefined });
			if (url === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "test-access-token" });
			return init?.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json({ name: "accounts/123/productInputs/en~US~artwork-41" });
		}) as typeof fetch;
		await expect(syncGoogleArtwork(env, 41, mockFetch, artwork)).resolves.toBe("submitted");
		await expect(syncGoogleArtwork(env, 41, mockFetch, null)).resolves.toBe("removed");
		expect(requests[0].method).toBe("POST");
		expect(requests[1].url).toBe("https://merchantapi.googleapis.com/products/v1/accounts/123/productInputs:insert?dataSource=accounts%2F123%2FdataSources%2F456");
		expect(requests[1].body).toMatchObject({ offerId: "artwork-41", productAttributes: { price: { amountMicros: "250000000" } } });
		expect(requests[3].url).toBe("https://merchantapi.googleapis.com/products/v1/accounts/123/productInputs/en~US~artwork-41?dataSource=accounts%2F123%2FdataSources%2F456");
	});

	test("reconciliation sends available items and tolerates absent removals", async () => {
		const env = await testEnv();
		const methods: string[] = [];
		const mockFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			if (String(input) === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "token" });
			methods.push(init?.method ?? "GET");
			return init?.method === "DELETE" ? new Response(null, { status: 404 }) : Response.json({});
		}) as typeof fetch;
		expect(await syncGoogleCatalog(env, [artwork], ["artwork-41", "artwork-42"], mockFetch)).toEqual({ submitted: 1, removed: 1 });
		expect(methods).toEqual(["POST", "DELETE"]);
	});
});
