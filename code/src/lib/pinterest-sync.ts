import type { Env } from "../db";
import { toPinterestCatalogItem, type PinterestCatalogArtwork } from "./pinterest-feed";

const apiBase = "https://api.pinterest.com/v5";
const scopes = "catalogs:read,catalogs:write";

type ApiFetch = typeof fetch;
type ApiItem = { item_id?: string; item_response_kind?: string };
type BatchItem = { item_id?: string; status?: string; errors?: Array<{ message?: string }> };
type Batch = { batch_id?: string; status?: string; items?: BatchItem[] };

export class PinterestSyncError extends Error {
	constructor(message: string, readonly status = 502) { super(message); }
}

export function isPinterestConfigured(env: Env) {
	return Boolean(env.PINTEREST_APP_ID && env.PINTEREST_APP_SECRET && env.PINTEREST_CATALOG_ID);
}

function requireConfig(env: Env) {
	if (!isPinterestConfigured(env)) throw new PinterestSyncError("Pinterest app secret is not configured", 503);
	return {
		appId: env.PINTEREST_APP_ID!,
		appSecret: env.PINTEREST_APP_SECRET!,
		catalogId: env.PINTEREST_CATALOG_ID!,
	};
}

async function jsonResponse<T>(response: Response): Promise<T> {
	if (response.status >= 300 && response.status < 400) {
		throw new PinterestSyncError("Pinterest redirected an API request");
	}
	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			throw new PinterestSyncError("Pinterest denied catalog access; check the app owner and catalog scopes", 502);
		}
		throw new PinterestSyncError(`Pinterest API returned HTTP ${response.status}`);
	}
	try { return await response.json() as T; }
	catch { throw new PinterestSyncError("Pinterest returned an invalid response"); }
}

async function accessToken(env: Env, apiFetch: ApiFetch) {
	const { appId, appSecret } = requireConfig(env);
	const body = new URLSearchParams({ grant_type: "client_credentials", scope: scopes });
	const result = await jsonResponse<{ access_token?: string; scope?: string }>(await apiFetch(`${apiBase}/oauth/token`, {
		method: "POST",
		headers: {
			Authorization: `Basic ${btoa(`${appId}:${appSecret}`)}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body,
		redirect: "manual",
	}));
	const granted = new Set(result.scope?.split(/[\s,]+/) ?? []);
	if (!result.access_token || !granted.has("catalogs:read") || !granted.has("catalogs:write")) {
		throw new PinterestSyncError("Pinterest did not grant both catalog read and write scopes", 502);
	}
	return result.access_token;
}

async function pinterestRequest<T>(path: string, token: string, apiFetch: ApiFetch, body?: unknown) {
	return jsonResponse<T>(await apiFetch(`${apiBase}${path}`, {
		method: body === undefined ? "GET" : "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
		redirect: "manual",
	}));
}

export function buildPinterestOperations(
	artworks: PinterestCatalogArtwork[],
	knownIds: string[],
	existingIds: string[],
	site = new URL("https://eonmun.com"),
) {
	const listed = artworks.map((artwork) => toPinterestCatalogItem(artwork, site));
	const availableIds = new Set(listed.map((item) => item.id));
	const known = new Set(knownIds);
	return [
		...listed.map((item) => ({
			item_id: item.id,
			operation: "UPSERT",
			attributes: {
				id: item.id,
				title: item.title,
				description: item.description,
				link: item.link,
				image_link: [item.image_link],
				price: item.price,
				availability: item.availability,
				condition: "new",
			},
		})),
		...existingIds.filter((id) => known.has(id) && !availableIds.has(id))
			.map((item_id) => ({ item_id, operation: "DELETE" })),
	];
}

export async function syncPinterestCatalog(
	env: Env,
	artworks: PinterestCatalogArtwork[],
	knownIds: string[],
	apiFetch: ApiFetch = fetch,
) {
	const { catalogId } = requireConfig(env);
	if (knownIds.length > 1000) throw new PinterestSyncError("Catalog exceeds the current 1,000-item sync limit", 409);
	const token = await accessToken(env, apiFetch);
	const feeds = await pinterestRequest<{ items?: unknown[] }>(
		`/catalogs/feeds?catalog_id=${encodeURIComponent(catalogId)}`, token, apiFetch,
	);
	if (feeds.items?.length) throw new PinterestSyncError("Pinterest already has a feed for this catalog; choose one catalog writer", 409);
	const existing = knownIds.length ? await pinterestRequest<{ items?: ApiItem[] }>(
		"/catalogs/items", token, apiFetch, {
			country: "US", language: "en-US",
			filters: { catalog_type: "RETAIL", catalog_id: catalogId, item_ids: knownIds },
		},
	) : { items: [] };
	const existingIds = (existing.items ?? [])
		.filter((item) => item.item_response_kind === "retail_item" && typeof item.item_id === "string")
		.map((item) => item.item_id!);
	const operations = buildPinterestOperations(artworks, knownIds, existingIds);
	if (operations.length === 0) return { status: "NOTHING_TO_SYNC", batch_id: null, items: [] };
	if (operations.length > 1000) throw new PinterestSyncError("Catalog exceeds the current 1,000-operation sync limit", 409);
	const batch = await pinterestRequest<Batch>("/catalogs/items/batch", token, apiFetch, {
		catalog_id: catalogId,
		catalog_type: "RETAIL",
		country: "US",
		language: "en-US",
		items: operations,
	});
	if (!batch.batch_id) throw new PinterestSyncError("Pinterest did not return a batch ID");
	return summarizeBatch(batch);
}

function summarizeBatch(batch: Batch) {
	return {
		status: batch.status ?? "UNKNOWN",
		batch_id: batch.batch_id ?? null,
		items: (batch.items ?? []).map((item) => ({
			item_id: item.item_id,
			status: item.status ?? "UNKNOWN",
			errors: (item.errors ?? []).map((error) => error.message ?? "Pinterest rejected this item"),
		})),
	};
}

export async function getPinterestBatchStatus(env: Env, batchId: string, apiFetch: ApiFetch = fetch) {
	if (!/^\d+$/.test(batchId)) throw new PinterestSyncError("Invalid batch ID", 400);
	const token = await accessToken(env, apiFetch);
	const batch = await pinterestRequest<Batch>(`/catalogs/items/batch/${batchId}`, token, apiFetch);
	return summarizeBatch(batch);
}
