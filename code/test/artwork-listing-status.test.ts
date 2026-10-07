import { describe, expect, test } from "bun:test";
import { getArtworkListingStatus, summarizeGoogleProduct } from "../src/lib/artwork-listing-status";
import { getGoogleArtworkProduct } from "../src/lib/google-merchant";

const pinterestEnv = { PINTEREST_APP_ID: "123", PINTEREST_APP_SECRET: "test-secret", PINTEREST_CATALOG_ID: "456", PINTEREST_AD_ACCOUNT_ID: "789" };

async function googleEnv() {
	const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
	const key = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
	return { GOOGLE_MERCHANT_ACCOUNT_ID: "123", GOOGLE_MERCHANT_DATA_SOURCE_ID: "456",
		GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "sync@project.iam.gserviceaccount.com", private_key: `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...key))}\n-----END PRIVATE KEY-----` }) };
}

describe("artwork listing status", () => {
	test("keeps approval separate by US destination and includes actionable issues", () => {
		const result = summarizeGoogleProduct({ productStatus: {
			destinationStatuses: [{ reportingContext: "FREE_LISTINGS", pendingCountries: ["US"] }, { reportingContext: "SHOPPING_ADS", approvedCountries: ["US"] }],
			itemLevelIssues: [{ detail: "Image is being checked", documentation: "https://support.google.com/merchants/answer/123", applicableCountries: ["US"] },
				{ description: "Other country issue", applicableCountries: ["CA"] }, { description: "Unsafe URL", documentation: "javascript:alert(1)" }],
		} }, []);
		expect(result.label).toBe("Mixed approval");
		expect(result.destinations).toEqual([{ label: "Free listings", status: "In review" }, { label: "Shopping ads", status: "Approved" }]);
		expect(result.issues).toEqual([{ message: "Image is being checked", url: "https://support.google.com/merchants/answer/123" }, { message: "Unsafe URL", url: undefined }]);
		expect(summarizeGoogleProduct(null, []).label).toBe("Not found");
	});

	test("reads the processed Google product without submitting changes and treats 404 as absent", async () => {
		const env = await googleEnv();
		let missing = false;
		const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(init?.redirect).toBe("manual");
			if (String(input) === "https://oauth2.googleapis.com/token") return Response.json({ access_token: "test-google-token" });
			expect(String(input)).toBe("https://merchantapi.googleapis.com/products/v1/accounts/123/products/en~US~artwork-41");
			expect(init?.method ?? "GET").toBe("GET");
			expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer test-google-token");
			return missing ? Response.json({}, { status: 404 }) : Response.json({ offerId: "artwork-41", productStatus: { destinationStatuses: [{ reportingContext: "FREE_LISTINGS", pendingCountries: ["US"] }] } });
		}) as typeof fetch;
		expect((await getArtworkListingStatus(env, 41, undefined, apiFetch)).google.label).toBe("In review");
		missing = true;
		expect(await getGoogleArtworkProduct(env, 41, apiFetch)).toBeNull();
	});

	test("uses user catalog authorization and only links Pin IDs returned for this artwork", async () => {
		const apiFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
			expect(String(input)).toBe("https://api.pinterest.com/v5/catalogs/items?ad_account_id=789");
			expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer user-catalog-token");
			expect(JSON.parse(String(init?.body))).toEqual({ country: "US", language: "en-US", filters: { catalog_type: "RETAIL", catalog_id: "456", item_ids: ["artwork-41"] } });
			return Response.json({ items: [{ attributes: { item_id: "artwork-42" }, pins: [{ id: "42" }] },
				{ attributes: { item_id: "artwork-41" }, pins: [{ id: "123456" }, { id: "javascript:bad" }] }] });
		}) as typeof fetch;
		const result = await getArtworkListingStatus({ ...pinterestEnv, PINTEREST_CATALOG_ACCESS_TOKEN: "user-catalog-token" }, 41, undefined, apiFetch);
		expect(result.pinterest.label).toBe("Pin available");
		expect(result.pinterest.links).toHaveLength(2);
		expect(result.pinterest.links[1].url).toBe("https://www.pinterest.com/pin/123456/");
		expect(result.google.label).toBe("Not connected");
	});

	test("uses this artwork's batch result when catalog lookup is not connected", async () => {
		const paths: string[] = [];
		const apiFetch = (async (input: RequestInfo | URL) => {
			paths.push(new URL(String(input)).pathname);
			return Response.json(paths.length === 1 ? { access_token: "app-token", scope: "catalogs:read catalogs:write" }
				: { batch_id: "batch1", status: "COMPLETED", items: [{ item_id: "artwork-42", status: "FAILURE", errors: [{ message: "Other artwork failed" }] },
					{ item_id: "artwork-41", status: "SUCCESS", warnings: [{ message: "Category missing" }] }] });
		}) as typeof fetch;
		const result = await getArtworkListingStatus(pinterestEnv, 41, { id: "batch1", deletion: false }, apiFetch);
		expect(paths).toEqual(["/v5/oauth/token", "/v5/catalogs/items/batch/batch1"]);
		expect(result.pinterest.label).toBe("Ingested");
		expect(result.pinterest.issues).toEqual([{ message: "Category missing" }]);
		expect(result.pinterest.message).toContain("does not confirm public Pin visibility");
	});

	test("provider failures remain unavailable and do not become approval or absence", async () => {
		const env = { ...await googleEnv(), ...pinterestEnv, PINTEREST_CATALOG_ACCESS_TOKEN: "catalog-token" };
		const apiFetch = (async (input: RequestInfo | URL) => String(input) === "https://oauth2.googleapis.com/token"
			? Response.json({ access_token: "google-token" }) : Response.json({ message: "Denied" }, { status: 403 })) as typeof fetch;
		const result = await getArtworkListingStatus(env, 41, undefined, apiFetch);
		expect(result.google.label).toBe("Status unavailable");
		expect(result.pinterest.label).toBe("Status unavailable");
		expect(JSON.stringify(result)).not.toContain("catalog-token");
		expect(JSON.stringify(result)).not.toContain("google-token");
	});
});
