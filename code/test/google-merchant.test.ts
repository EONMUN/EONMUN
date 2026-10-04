import { describe, expect, test } from "bun:test";
import { activateGoogleMerchant, ensureGoogleMerchantServiceAccount, googleProductInput, hasGoogleMerchantAccess, registerGoogleMerchantProject, syncGoogleArtwork, syncGoogleCatalog } from "../src/lib/google-merchant";
import type { CatalogArtwork } from "../src/lib/catalog-artwork";

const artwork: CatalogArtwork = {
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
		GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "sync@project.iam.gserviceaccount.com", private_key: pem }),
	};
}

describe("Google Merchant sync", () => {
	test.each(["missing", "existing", "read-only", "concurrent"])("grants the configured service account product access: %s", async (state) => {
		const env = await testEnv();
		const methods: string[] = [];
		const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const method = init?.method ?? "GET";
			methods.push(method);
			expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer human-token");
			expect(String(input)).toContain("sync%40project.iam.gserviceaccount.com");
			if (method === "GET") {
				if ((state === "missing" || state === "concurrent") && methods.length === 1) return Response.json({}, { status: 404 });
				return Response.json({ accessRights: state === "read-only" ? ["READ_ONLY", "API_DEVELOPER"] : ["ADMIN"] });
			}
			if (method === "POST") {
				expect(String(input)).toContain("/users?userId=");
				expect(JSON.parse(String(init?.body))).toEqual({ accessRights: ["STANDARD"] });
				return state === "concurrent" ? Response.json({}, { status: 409 }) : Response.json({ accessRights: ["STANDARD"], state: "PENDING" });
			}
			expect(String(input)).toContain("?updateMask=accessRights");
			expect(JSON.parse(String(init?.body))).toEqual({ name: "accounts/123/users/sync@project.iam.gserviceaccount.com", accessRights: ["API_DEVELOPER", "STANDARD"] });
			return Response.json({});
		}) as typeof fetch;
		await ensureGoogleMerchantServiceAccount(env, "human-token", apiFetch);
		expect(methods).toEqual(state === "missing" ? ["GET", "POST"] : state === "read-only" ? ["GET", "PATCH"] : state === "concurrent" ? ["GET", "POST", "GET"] : ["GET"]);
	});

	test("does not invite users after permission denial or with a non-service-account identity", async () => {
		const env = await testEnv();
		const apiFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
			expect(init?.method ?? "GET").toBe("GET");
			return Response.json({}, { status: 403 });
		}) as typeof fetch;
		await expect(ensureGoogleMerchantServiceAccount(env, "human-token", apiFetch)).rejects.toThrow("access setup failed (HTTP 403)");
		const invalid = { ...env, GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "someone@example.com", private_key: "unused" }) };
		await expect(ensureGoogleMerchantServiceAccount(invalid, "human-token", apiFetch)).rejects.toThrow("must identify a Google service account");
	});

	test("accepts an existing registration only for the configured Merchant account", async () => {
		const env = await testEnv();
		for (const account of ['accounts/123', 'accounts/999']) {
			const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
				expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer human-token');
				if (String(input).endsWith(':registerGcp')) return Response.json({}, { status: 409 });
				expect(String(input)).toBe('https://merchantapi.googleapis.com/accounts/v1/accounts:getAccountForGcpRegistration');
				return Response.json({ name: account });
			}) as typeof fetch;
			if (account === 'accounts/123') await registerGoogleMerchantProject(env, 'human-token', 'admin@example.com', apiFetch);
			else await expect(registerGoogleMerchantProject(env, 'human-token', 'admin@example.com', apiFetch)).rejects.toThrow('connection failed (HTTP 409)');
		}
	});

	test("reports connection from a read-only service-account check", async () => {
		const env = await testEnv();
		for (const status of [200, 401]) {
			const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
				if (String(input) === 'https://oauth2.googleapis.com/token') return Response.json({ access_token: 'service-token' });
				expect(String(input)).toBe('https://merchantapi.googleapis.com/datasources/v1/accounts/123/dataSources/456');
				expect(init?.method ?? 'GET').toBe('GET');
				return Response.json({}, { status });
			}) as typeof fetch;
			expect(await hasGoogleMerchantAccess(env, apiFetch)).toBe(status === 200);
		}
	});

	test("registers with the human token, then verifies pending service access with its own token", async () => {
		const env = await testEnv();
		const requests: Array<{ url: string; method: string; token: string | null }> = [];
		let verified = false;
		const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			requests.push({ url, method: init?.method ?? "GET", token: new Headers(init?.headers).get("Authorization") });
			if (url.endsWith(":registerGcp")) {
				expect(JSON.parse(String(init?.body))).toEqual({ developerEmail: "admin@example.com" });
				return Response.json({});
			}
			if (url === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "service-token" });
			if (url.endsWith(":verifySelf")) { verified = true; return Response.json({ state: "VERIFIED" }); }
			return Response.json({}, { status: verified ? 200 : 401 });
		}) as typeof fetch;
		await registerGoogleMerchantProject(env, "human-token", "admin@example.com", apiFetch);
		await activateGoogleMerchant(env, apiFetch);
		expect(requests[0].token).toBe("Bearer human-token");
		expect(requests.slice(2).map(r => [r.method, r.token])).toEqual([
			["GET", "Bearer service-token"], ["PATCH", "Bearer service-token"], ["GET", "Bearer service-token"],
		]);
		expect(requests[3].url).toBe("https://merchantapi.googleapis.com/accounts/v1/accounts/123/users/me:verifySelf");
		expect(requests[4].url).toBe("https://merchantapi.googleapis.com/datasources/v1/accounts/123/dataSources/456");
	});

	test("retries an already active connection without re-verifying or accepting data source failures", async () => {
		const env = await testEnv();
		for (const status of [200, 404]) {
			const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
				if (String(input) === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "service-token" });
				expect(init?.method).not.toBe("PATCH");
				return Response.json({}, { status });
			}) as typeof fetch;
			if (status === 200) await activateGoogleMerchant(env, apiFetch);
			else await expect(activateGoogleMerchant(env, apiFetch)).rejects.toThrow("data source access failed (HTTP 404)");
		}
	});

	test("reports registration propagation failure without exposing provider response bodies", async () => {
		const env = await testEnv();
		const apiFetch = (async (input: RequestInfo | URL) => String(input) === "https://oauth2.googleapis.com/token"
			? Response.json({ access_token: "service-token" })
			: Response.json({ error: "sensitive-provider-detail" }, { status: 401 })) as typeof fetch;
		await expect(activateGoogleMerchant(env, apiFetch)).rejects.toThrow("wait five minutes and retry");
		await expect(registerGoogleMerchantProject(env, "human-token", "admin@example.com", apiFetch)).rejects.toThrow("connection failed (HTTP 401)");
	});

	test.each(["dataSources", "verifySelf"])("distinguishes an unregistered project reported by %s from other access failures", async (endpoint) => {
		const env = await testEnv();
		const apiFetch = (async (input: RequestInfo | URL) => String(input) === "https://oauth2.googleapis.com/token"
			? Response.json({ access_token: "service-token" })
			: Response.json({ error: { message: "private-upstream-detail", ...(String(input).includes(endpoint) ? { details: [{ metadata: { REASON: "GCP_NOT_REGISTERED" } }] } : {}) } }, { status: 401 })) as typeof fetch;
		await expect(activateGoogleMerchant(env, apiFetch)).rejects.toThrow("Choose Connect Google Merchant and approve access");
	});

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

	test("normalizes owned images to JPEG without proxying external images", () => {
		const imageUrl = "https://r2.eonmun.com/camera photo.jpeg";
		const normalized = new URL(googleProductInput({ ...artwork, imageUrl }).productAttributes.imageLink);
		expect(normalized.origin + normalized.pathname).toBe("https://eonmun.com/_image");
		expect(normalized.searchParams.get("href")).toBe(new URL(imageUrl).href);
		expect(normalized.searchParams.get("f")).toBe("jpeg");
		expect(googleProductInput(artwork).productAttributes.imageLink).toBe(artwork.imageUrl);
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
		expect(await syncGoogleCatalog(env, [artwork], ["artwork-41", "artwork-42"], mockFetch)).toEqual({ submitted: 1, removed: 1, failed: [] });
		expect(methods).toEqual(["POST", "DELETE"]);
	});

	test("a rejected listing does not block later sold-artwork removal", async () => {
		const env = await testEnv();
		const attempted: string[] = [];
		const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			if (String(input) === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "token" });
			if (init?.method === "DELETE") {
				attempted.push("remove");
				return new Response(null, { status: 204 });
			}
			const id = JSON.parse(String(init?.body)).offerId;
			attempted.push(id);
			return Response.json({}, { status: id === "artwork-42" ? 400 : 200 });
		}) as typeof fetch;
		const result = await syncGoogleCatalog(env, [artwork, { ...artwork, id: 42 }], ["artwork-41", "artwork-42", "artwork-43"], apiFetch);
		expect(attempted).toEqual(["artwork-41", "artwork-42", "remove"]);
		expect(result).toEqual({ submitted: 1, removed: 1, failed: [{ id: "artwork-42", error: "Google Merchant product submission failed (HTTP 400)" }] });
	});
});
