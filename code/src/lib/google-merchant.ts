import type { Env } from "../db";
import { getAvailableArtworkById } from "../db/catalog";
import { R2_PUBLIC_ORIGIN } from "./media";
import { catalogArtworkFields, type CatalogArtwork } from "./catalog-artwork";
import { SITE_URL } from "../consts";

const tokenUrl = "https://oauth2.googleapis.com/token";
const apiBase = "https://merchantapi.googleapis.com/products/v1";
export const GOOGLE_MERCHANT_SCOPE = "https://www.googleapis.com/auth/content";
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
		{ iss: credentials.client_email, scope: GOOGLE_MERCHANT_SCOPE, aud: tokenUrl, iat: now, exp: now + 3600 },
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

export async function registerGoogleMerchantProject(env: Env, token: string, email: string, apiFetch: ApiFetch = fetch) {
	const { account } = config(env);
	const response = await apiFetch(`https://merchantapi.googleapis.com/accounts/v1/accounts/${account}/developerRegistration:registerGcp`, {
		method: "POST",
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		body: JSON.stringify({ developerEmail: email }),
		redirect: "manual",
	});
	if (!response.ok) {
		// Registration can finish before activation does; verify its account before accepting a retry.
		const registered = await apiFetch("https://merchantapi.googleapis.com/accounts/v1/accounts:getAccountForGcpRegistration", {
			headers: { Authorization: `Bearer ${token}` }, redirect: "manual",
		});
		if (registered.ok && (await registered.json() as { name?: string }).name === `accounts/${account}`) return;
		throw new GoogleMerchantError(`Google Merchant connection failed (HTTP ${response.status}). Use a Google account with Admin access to Merchant Center and an OAuth client in the service account's Cloud project.`);
	}
}

export async function hasGoogleMerchantAccess(env: Env, apiFetch: ApiFetch = fetch) {
	if (!isGoogleMerchantConfigured(env)) return false;
	try {
		const { dataSource, credentials } = config(env);
		const token = await accessToken(credentials, apiFetch);
		const response = await apiFetch(`https://merchantapi.googleapis.com/datasources/v1/${dataSource}`, {
			headers: { Authorization: `Bearer ${token}` }, redirect: "manual",
		});
		return response.ok;
	} catch { return false; }
}

export async function ensureGoogleMerchantServiceAccount(env: Env, adminToken: string, apiFetch: ApiFetch = fetch) {
	const { account, credentials } = config(env);
	const email = credentials.client_email;
	if (typeof email !== "string" || !email.endsWith(".iam.gserviceaccount.com")) {
		throw new GoogleMerchantError("Google Merchant credentials must identify a Google service account");
	}
	// SECURITY: the invited identity comes only from the configured key, never browser input.
	const usersUrl = `https://merchantapi.googleapis.com/accounts/v1/accounts/${account}/users`;
	const userUrl = `${usersUrl}/${encodeURIComponent(email)}`;
	const options = { headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }, redirect: "manual" as const };
	let response = await apiFetch(userUrl, options);
	if (response.status === 404) {
		response = await apiFetch(`${usersUrl}?userId=${encodeURIComponent(email)}`, {
			...options, method: "POST", body: JSON.stringify({ accessRights: ["STANDARD"] }),
		});
		if (response.status === 409) response = await apiFetch(userUrl, options);
	}
	if (!response.ok) throw new GoogleMerchantError(`Google Merchant service-account access setup failed (HTTP ${response.status}). Connect using a Merchant Center admin account.`);
	const user = await response.json() as { accessRights?: string[] };
	const rights = user.accessRights ?? [];
	if (rights.includes("STANDARD") || rights.includes("ADMIN")) return;
	const updated = await apiFetch(`${userUrl}?updateMask=accessRights`, {
		...options, method: "PATCH", body: JSON.stringify({ name: `accounts/${account}/users/${email}`, accessRights: [...rights.filter((right) => right !== "READ_ONLY"), "STANDARD"] }),
	});
	if (!updated.ok) throw new GoogleMerchantError(`Google Merchant service-account permissions could not be updated (HTTP ${updated.status}). Connect using a Merchant Center admin account.`);
}

export async function activateGoogleMerchant(env: Env, apiFetch: ApiFetch = fetch) {
	const { account, dataSource, credentials } = config(env);
	const token = await accessToken(credentials, apiFetch);
	const options = { headers: { Authorization: `Bearer ${token}` }, redirect: "manual" as const };
	const sourceUrl = `https://merchantapi.googleapis.com/datasources/v1/${dataSource}`;
	let source = await apiFetch(sourceUrl, options);
	if (source.status === 401 || source.status === 403) {
		const verified = await apiFetch(`https://merchantapi.googleapis.com/accounts/v1/accounts/${account}/users/me:verifySelf`, {
			...options, method: "PATCH",
		});
		if (!verified.ok) {
			const failures = await Promise.all([source, verified].map(response => response.json().catch(() => null))) as Array<{ error?: { details?: Array<{ metadata?: { REASON?: string } }> } } | null>;
			if (failures.some(failure => Array.isArray(failure?.error?.details) && failure.error.details.some(detail => detail?.metadata?.REASON === "GCP_NOT_REGISTERED"))) {
				throw new GoogleMerchantError("Google account authorization is not complete. Choose Connect Google Merchant and approve access with your Merchant Center admin account. If you just approved access, wait five minutes and retry the sync.");
			}
			throw new GoogleMerchantError(`Google Merchant access is not ready (HTTP ${verified.status}). Connect Google Merchant first; if you just connected, wait five minutes and retry. The service account must be added to Merchant Center.`);
		}
		source = await apiFetch(sourceUrl, options);
	}
	if (!source.ok) throw new GoogleMerchantError(`Google Merchant data source access failed (HTTP ${source.status}). Check the service account permissions and API data source.`);
}

function googleImageLink(url: string) {
	const image = new URL(url);
	let imageLink = url;
	if (image.origin === R2_PUBLIC_ORIGIN) {
		// Normalize uploaded camera images to JPEG for Merchant Center's image decoder.
		const normalized = new URL("/_image", SITE_URL);
		normalized.search = new URLSearchParams({ href: image.href, w: "1600", q: "90", f: "jpeg", fit: "scale-down" }).toString();
		imageLink = normalized.href;
	}
	return imageLink;
}

export function googleProductInput(artwork: CatalogArtwork) {
	const fields = catalogArtworkFields(artwork);
	const imageLink = googleImageLink(artwork.imageUrl);
	const additionalImageLinks = [...new Set((artwork.additionalImageUrls ?? []).map(googleImageLink))]
		.filter((url) => url !== imageLink).slice(0, 10);
	return {
		offerId: fields.id,
		contentLanguage: "en",
		feedLabel: "US",
		productAttributes: {
			title: fields.title,
			description: fields.description,
			link: fields.link,
			imageLink,
			additionalImageLinks,
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

export async function syncGoogleArtwork(env: Env, artworkId: number, apiFetch: ApiFetch = fetch, available?: CatalogArtwork | null) {
	const { account, dataSource, credentials } = config(env);
	const artwork = available === undefined ? await getAvailableArtworkById(env, artworkId) : available;
	const token = await accessToken(credentials, apiFetch);
	return submitArtwork(account, dataSource, token, artworkId, artwork, apiFetch);
}

async function submitArtwork(account: string, dataSource: string, token: string, artworkId: number, artwork: CatalogArtwork | null, apiFetch: ApiFetch) {
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

export async function syncGoogleCatalog(env: Env, artworks: CatalogArtwork[], ids: string[], apiFetch: ApiFetch = fetch) {
	const { account, dataSource, credentials } = config(env);
	const available = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	const token = await accessToken(credentials, apiFetch);
	let submitted = 0;
	let removed = 0;
	const failed: Array<{ id: string; error: string }> = [];
	for (const id of ids) {
		const match = /^artwork-(\d+)$/.exec(id);
		if (!match) continue;
		const artworkId = Number(match[1]);
		try {
			const result = await submitArtwork(account, dataSource, token, artworkId, available.get(artworkId) ?? null, apiFetch);
			if (result === "submitted") submitted++;
			else removed++;
		} catch (error) {
			failed.push({ id, error: error instanceof GoogleMerchantError ? error.message : "Google Merchant item sync failed" });
		}
	}
	return { submitted, removed, failed };
}
