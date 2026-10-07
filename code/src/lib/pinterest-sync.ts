import type { Env } from "../db";
import { getAvailableArtworkById } from "../db/catalog";
import { toPinterestCatalogItem } from "./pinterest-feed";
import type { CatalogArtwork } from "./catalog-artwork";

const apiBase = "https://api.pinterest.com/v5";
const scopes = "catalogs:read,catalogs:write";

type ApiFetch = typeof fetch;
type BatchItem = { item_id?: string; status?: string; errors?: Array<{ message?: string }>; warnings?: Array<{ message?: string }> };
type Batch = { batch_id?: string; status?: string; items?: BatchItem[] };

export class PinterestSyncError extends Error {
	constructor(message: string, readonly status = 502) { super(message); }
}

export function isPinterestConfigured(env: Env) {
	return Boolean(env.PINTEREST_APP_ID && env.PINTEREST_APP_SECRET && env.PINTEREST_CATALOG_ID);
}

export interface PinterestCatalogItem {
	attributes?: { item_id?: string };
	item_id?: string;
	pins?: Array<{ id?: string }>;
	errors?: Array<{ message?: string }>;
	locale_errors?: Array<{ message?: string }>;
}

export async function getPinterestArtworkItem(env: Env, artworkId: number, apiFetch: ApiFetch = fetch): Promise<PinterestCatalogItem | null> {
	const { catalogId, adAccountId } = requireConfig(env);
	// Catalog item and Pin lookup requires user authorization; app tokens support batch sync.
	const token = env.PINTEREST_CATALOG_ACCESS_TOKEN;
	if (!token) throw new PinterestSyncError("Pinterest catalog lookup is not connected", 503);
	const result = await pinterestRequest<{ items?: PinterestCatalogItem[] }>(
		withAdAccount("/catalogs/items", adAccountId), token, apiFetch, "catalog item lookup", {
			country: "US", language: "en-US",
			filters: { catalog_type: "RETAIL", catalog_id: catalogId, item_ids: [`artwork-${artworkId}`] },
		},
	);
	return result.items?.find((item) => (item.attributes?.item_id ?? item.item_id) === `artwork-${artworkId}`) ?? null;
}

function requireConfig(env: Env) {
	if (!isPinterestConfigured(env)) throw new PinterestSyncError("Pinterest app secret is not configured", 503);
	if (env.PINTEREST_AD_ACCOUNT_ID && !/^\d+$/.test(env.PINTEREST_AD_ACCOUNT_ID)) {
		throw new PinterestSyncError("Pinterest ad account ID must be numeric", 503);
	}
	return {
		appId: env.PINTEREST_APP_ID!,
		appSecret: env.PINTEREST_APP_SECRET!,
		catalogId: env.PINTEREST_CATALOG_ID!,
		adAccountId: env.PINTEREST_AD_ACCOUNT_ID,
	};
}

function withAdAccount(path: string, adAccountId?: string) {
	if (!adAccountId) return path;
	const separator = path.includes("?") ? "&" : "?";
	return `${path}${separator}ad_account_id=${encodeURIComponent(adAccountId)}`;
}

async function jsonResponse<T>(response: Response, operation: string): Promise<T> {
	if (response.status >= 300 && response.status < 400) {
		throw new PinterestSyncError(`Pinterest redirected ${operation}`);
	}
	if (!response.ok) {
		if (response.status === 401 || response.status === 403) {
			const details = await response.json().catch(() => null) as { code?: unknown; message?: unknown } | null;
			const code = typeof details?.code === "number" ? `, code ${details.code}` : "";
			const message = typeof details?.message === "string"
				? `: ${details.message.slice(0, 200).replace(/pin(?:a|c|r)_[A-Za-z0-9]+/g, "[redacted]")}`
				: "";
			throw new PinterestSyncError(`Pinterest denied ${operation} (HTTP ${response.status}${code})${message}`, 502);
		}
		throw new PinterestSyncError(`Pinterest returned HTTP ${response.status} during ${operation}`);
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
	}), "app authentication");
	const granted = new Set(result.scope?.split(/[\s,]+/) ?? []);
	if (!result.access_token || !granted.has("catalogs:read") || !granted.has("catalogs:write")) {
		throw new PinterestSyncError("Pinterest did not grant both catalog read and write scopes", 502);
	}
	return result.access_token;
}

async function pinterestRequest<T>(path: string, token: string, apiFetch: ApiFetch, operation: string, body?: unknown) {
	return jsonResponse<T>(await apiFetch(`${apiBase}${path}`, {
		method: body === undefined ? "GET" : "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
		redirect: "manual",
	}), operation);
}

export function buildPinterestOperations(
	artworks: CatalogArtwork[],
	knownIds: string[],
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
		...[...known].filter((id) => !availableIds.has(id))
			.map((item_id) => ({ item_id, operation: "DELETE" })),
	];
}

export async function syncPinterestCatalog(
	env: Env,
	artworks: CatalogArtwork[],
	knownIds: string[],
	apiFetch: ApiFetch = fetch,
) {
	const { catalogId, adAccountId } = requireConfig(env);
	if (knownIds.length > 1000) throw new PinterestSyncError("Catalog exceeds the current 1,000-item sync limit", 409);
	const token = await accessToken(env, apiFetch);
	const feeds = await pinterestRequest<{ items?: unknown[] }>(
		withAdAccount(`/catalogs/feeds?catalog_id=${encodeURIComponent(catalogId)}`, adAccountId), token, apiFetch, "catalog feed check",
	);
	if (feeds.items?.length) throw new PinterestSyncError("Pinterest already has a feed for this catalog; choose one catalog writer", 409);
	// Pinterest item lookup requires user OAuth; batch writes support app credentials.
	const operations = buildPinterestOperations(artworks, knownIds);
	if (operations.length === 0) return { status: "NOTHING_TO_SYNC", batch_id: null, items: [], deletionIds: [] as string[], failed: false };
	if (operations.length > 1000) throw new PinterestSyncError("Catalog exceeds the current 1,000-operation sync limit", 409);
	const batch = await pinterestRequest<Batch>(withAdAccount("/catalogs/items/batch", adAccountId), token, apiFetch, "catalog batch write", {
		catalog_type: "RETAIL",
		country: "US",
		language: "en-US",
		items: operations,
	});
	if (!batch.batch_id) throw new PinterestSyncError("Pinterest did not return a batch ID");
	return summarizeBatch(batch, operations.filter((item) => item.operation === "DELETE").map((item) => item.item_id));
}

export async function syncPinterestArtwork(env: Env, artworkId: number, apiFetch: ApiFetch = fetch) {
	const available = await getAvailableArtworkById(env, artworkId);
	return syncPinterestCatalog(env, available ? [available] : [], [`artwork-${artworkId}`], apiFetch);
}

function summarizeBatch(batch: Batch, deletionIds: string[] = []) {
	const deletions = new Set(deletionIds);
	const items = (batch.items ?? []).map((item) => {
		const errors = (item.errors ?? []).map((error) => error.message ?? "Pinterest rejected this item");
		// Only a known deletion with this exact response has already reached its desired state.
		const absent = item.status === "FAILURE" && deletions.has(item.item_id ?? "")
			&& errors.length === 1 && errors[0] === "Item is not found in the system.";
		return { item_id: item.item_id, status: absent ? "ALREADY_ABSENT" : item.status ?? "UNKNOWN", errors,
			warnings: (item.warnings ?? []).map((warning) => warning.message ?? "Pinterest reported a catalog warning") };
	});
	const allAbsent = items.length > 0 && items.length === deletions.size && items.every((item) => item.status === "ALREADY_ABSENT");
	const status = batch.status === "FAILED" && allAbsent ? "COMPLETED" : batch.status ?? "UNKNOWN";
	return {
		status,
		failed: status === "FAILED" || items.some((item) => item.status === "FAILURE"),
		providerStatus: batch.status ?? "UNKNOWN",
		batch_id: batch.batch_id ?? null,
		deletionIds,
		items,
	};
}

export async function getPinterestBatchStatus(env: Env, batchId: string, apiFetch: ApiFetch = fetch, deletionIds: string[] = []) {
	if (!/^[a-zA-Z0-9_-]{1,64}$/.test(batchId)) throw new PinterestSyncError("Invalid batch ID", 400);
	const { adAccountId } = requireConfig(env);
	const token = await accessToken(env, apiFetch);
	const batch = await pinterestRequest<Batch>(withAdAccount(`/catalogs/items/batch/${batchId}`, adAccountId), token, apiFetch, "catalog batch status check");
	return summarizeBatch(batch, deletionIds);
}
