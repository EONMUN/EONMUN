import type { Env } from "../db";
import { getAvailableArtworkById } from "../db/catalog";
import type { PinterestCatalogArtwork } from "./pinterest-feed";

const tokenUrl = "https://oauth2.googleapis.com/token";
const apiBase = "https://merchantapi.googleapis.com/products/v1";
const scope = "https://www.googleapis.com/auth/content";
type ApiFetch = typeof fetch;

export class GoogleMerchantError extends Error {}

export function isGoogleMerchantConfigured(env: Env) {
	return Boolean(env.GOOGLE_MERCHANT_ACCOUNT_ID && env.GOOGLE_MERCHANT_DATA_SOURCE_ID && env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON);
}

function config(env: Env) {
	if (!isGoogleMerchantConfigured(env)) throw new GoogleMerchantError("Google Merchant API is not configured");
	const account = env.GOOGLE_MERCHANT_ACCOUNT_ID!;
	const source = env.GOOGLE_MERCHANT_DATA_SOURCE_ID!;
	if (!/^\d+$/.test(account) || !/^\d+$/.test(source)) throw new GoogleMerchantError("Google Merchant account and data source IDs must be numeric");
	let credentials: { client_email?: string; private_key?: string };
	try { credentials = JSON.parse(env.GOOGLE_MERCHANT_SERVICE_ACCOUNT_JSON!); }
	catch { throw new GoogleMerchantError("Google Merchant service account JSON is invalid"); }
	if (!credentials.client_email || !credentials.private_key) throw new GoogleMerchantError("Google Merchant service account is missing its email or private key");
	return { account, dataSource: `accounts/${account}/dataSources/${source}`, credentials };
}

function base64url(bytes: Uint8Array) {
	return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function accessToken(credentials: { client_email?: string; private_key?: string }, apiFetch: ApiFetch) {
	const pem = credentials.private_key!.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
	const binary = atob(pem);
	const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(binary, (char) => char.charCodeAt(0)),
		{ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
	const now = Math.floor(Date.now() / 1000);
	const encoded = [
		{ alg: "RS256", typ: "JWT" },
		{ iss: credentials.client_email, scope, aud: tokenUrl, iat: now, exp: now + 3600 },
	].map((part) => base64url(new TextEncoder().encode(JSON.stringify(part)))).join(".");
	const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(encoded));
	const response = await apiFetch(tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${encoded}.${base64url(new Uint8Array(signature))}` }),
		redirect: "manual",
	});
	if (!response.ok) throw new GoogleMerchantError(`Google Merchant authentication failed (HTTP ${response.status})`);
	const body = await response.json() as { access_token?: string };
	if (!body.access_token) throw new GoogleMerchantError("Google Merchant did not return an access token");
	return body.access_token;
}

export function googleProductInput(artwork: PinterestCatalogArtwork) {
	return {
		offerId: `artwork-${artwork.id}`,
		contentLanguage: "en",
		feedLabel: "US",
		productAttributes: {
			title: artwork.title,
			description: artwork.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
			link: new URL(`/artworks/${encodeURIComponent(artwork.slug)}`, "https://eonmun.com").toString(),
			imageLink: artwork.imageUrl,
			availability: "IN_STOCK",
			condition: "NEW",
			identifierExists: false,
			price: { amountMicros: String(BigInt(artwork.priceCents) * 10_000n), currencyCode: "USD" },
		},
	};
}

async function merchantRequest(url: string, token: string, apiFetch: ApiFetch, method: "POST" | "DELETE", body?: unknown) {
	const response = await apiFetch(url, {
		method,
		headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
		...(body ? { body: JSON.stringify(body) } : {}),
		redirect: "manual",
	});
	if (method === "DELETE" && response.status === 404) return;
	if (!response.ok) throw new GoogleMerchantError(`Google Merchant product ${method === "POST" ? "submission" : "removal"} failed (HTTP ${response.status})`);
}

export async function syncGoogleArtwork(env: Env, artworkId: number, apiFetch: ApiFetch = fetch, available?: PinterestCatalogArtwork | null) {
	const { account, dataSource, credentials } = config(env);
	const artwork = available === undefined ? await getAvailableArtworkById(env, artworkId) : available;
	const token = await accessToken(credentials, apiFetch);
	return submitArtwork(account, dataSource, token, artworkId, artwork, apiFetch);
}

async function submitArtwork(account: string, dataSource: string, token: string, artworkId: number, artwork: PinterestCatalogArtwork | null, apiFetch: ApiFetch) {
	const source = encodeURIComponent(dataSource);
	if (artwork) {
		await merchantRequest(`${apiBase}/accounts/${account}/productInputs:insert?dataSource=${source}`,
			token, apiFetch, "POST", googleProductInput(artwork));
		return "submitted" as const;
	}
	const name = `en~US~artwork-${artworkId}`;
	await merchantRequest(`${apiBase}/accounts/${account}/productInputs/${name}?dataSource=${source}`,
		token, apiFetch, "DELETE");
	return "removed" as const;
}

export async function syncGoogleCatalog(env: Env, artworks: PinterestCatalogArtwork[], ids: string[], apiFetch: ApiFetch = fetch) {
	const { account, dataSource, credentials } = config(env);
	const available = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	const token = await accessToken(credentials, apiFetch);
	let submitted = 0;
	let removed = 0;
	for (const id of ids) {
		const match = /^artwork-(\d+)$/.exec(id);
		if (!match) continue;
		const artworkId = Number(match[1]);
		const result = await submitArtwork(account, dataSource, token, artworkId, available.get(artworkId) ?? null, apiFetch);
		if (result === "submitted") submitted++;
		else removed++;
	}
	return { submitted, removed };
}
