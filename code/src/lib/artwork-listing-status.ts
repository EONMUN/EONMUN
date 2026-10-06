import type { Env } from "../db";
import { getGoogleArtworkProduct, GoogleMerchantError, isGoogleMerchantConfigured, type GoogleProcessedProduct } from "./google-merchant";
import { getPinterestArtworkItem, getPinterestBatchStatus, isPinterestConfigured, PinterestSyncError } from "./pinterest-sync";

export interface ListingProviderStatus {
	label: string;
	message: string;
	destinations: Array<{ label: string; status: string }>;
	issues: Array<{ message: string; url?: string }>;
	links: Array<{ label: string; url: string }>;
}

const googleContexts: Record<string, string> = { FREE_LISTINGS: "Free listings", SHOPPING_ADS: "Shopping ads" };

function googleDocumentation(value?: string) {
	try {
		const url = new URL(value ?? "");
		if (url.protocol === "https:" && !url.username && !url.password && ["support.google.com", "developers.google.com"].includes(url.hostname)) return url.href;
	} catch { /* An issue without a documentation URL still has a description. */ }
}

export function summarizeGoogleProduct(product: GoogleProcessedProduct | null, links: ListingProviderStatus["links"]): ListingProviderStatus {
	if (!product) return { label: "Not found", message: "Google has not returned a processed product. A new submission can take several minutes to appear.", destinations: [], issues: [], links };
	const destinations = (product.productStatus?.destinationStatuses ?? []).map((destination) => ({
		label: googleContexts[destination.reportingContext ?? ""] ?? (destination.reportingContext ?? "Other destination").replaceAll("_", " ").toLowerCase(),
		status: destination.disapprovedCountries?.includes("US") ? "Disapproved"
			: destination.pendingCountries?.includes("US") ? "In review"
				: destination.approvedCountries?.includes("US") ? "Approved" : "Not targeted to US",
	}));
	const states = new Set(destinations.map((destination) => destination.status).filter((status) => status !== "Not targeted to US"));
	const label = states.size > 1 ? "Mixed approval" : [...states][0] ?? "Processing";
	return {
		label, message: "Google's eligibility result for the United States. Approval does not guarantee placement in search results.", destinations,
		issues: (product.productStatus?.itemLevelIssues ?? []).filter((issue) => !issue.applicableCountries?.length || issue.applicableCountries.includes("US"))
			.map((issue) => ({ message: issue.detail || issue.description || "Google reported a product issue", url: googleDocumentation(issue.documentation) })),
		links,
	};
}

export async function getArtworkListingStatus(
	env: Env,
	artworkId: number,
	pinterestBatch?: { id: string; deletion: boolean },
	apiFetch: typeof fetch = fetch,
) {
	const googleLinks = [{ label: "Open Merchant Center", url: `https://merchants.google.com/mc/products${env.GOOGLE_MERCHANT_ACCOUNT_ID && /^\d+$/.test(env.GOOGLE_MERCHANT_ACCOUNT_ID) ? `?a=${env.GOOGLE_MERCHANT_ACCOUNT_ID}` : ""}` }];
	const pinterestLinks = [{ label: "Open Pinterest Business", url: "https://www.pinterest.com/business/hub/" }];
	const unavailable = (message: string, links: ListingProviderStatus["links"], label = "Status unavailable"): ListingProviderStatus => ({ label, message, destinations: [], issues: [], links });
	const google = async (): Promise<ListingProviderStatus> => {
		if (!isGoogleMerchantConfigured(env)) return unavailable("Connect Google Merchant in Settings to check this artwork.", googleLinks, "Not connected");
		try { return summarizeGoogleProduct(await getGoogleArtworkProduct(env, artworkId, apiFetch), googleLinks); }
		catch (error) { return unavailable(error instanceof GoogleMerchantError ? error.message : "Google Merchant could not be reached. Try refreshing the status.", googleLinks); }
	};
	const pinterest = async (): Promise<ListingProviderStatus> => {
		if (!isPinterestConfigured(env)) return unavailable("Connect Pinterest in Settings to check this artwork.", pinterestLinks, "Not connected");
		const [catalog, batch] = await Promise.allSettled([
			getPinterestArtworkItem(env, artworkId, apiFetch),
			pinterestBatch ? getPinterestBatchStatus(env, pinterestBatch.id, apiFetch, pinterestBatch.deletion ? [`artwork-${artworkId}`] : []) : Promise.resolve(null),
		]);
		const links = [...pinterestLinks];
		const issues: ListingProviderStatus["issues"] = [];
		if (catalog.status === "fulfilled" && catalog.value) {
			for (const pin of catalog.value.pins ?? []) {
				if (pin.id && /^\d+$/.test(pin.id)) links.push({ label: "View Product Pin", url: `https://www.pinterest.com/pin/${pin.id}/` });
			}
			for (const issue of [...(catalog.value.errors ?? []), ...(catalog.value.locale_errors ?? [])]) issues.push({ message: issue.message ?? "Pinterest reported a catalog issue" });
		}
		if (batch.status === "fulfilled" && batch.value) {
			const result = batch.value;
			const item = result.items.find((entry) => entry.item_id === `artwork-${artworkId}`);
			issues.push(...(item?.errors ?? []).map((message) => ({ message })), ...(item?.warnings ?? []).map((message) => ({ message })));
			const label = item?.status === "FAILURE" || result.status === "FAILED" ? "Submission failed"
				: item?.status === "SUCCESS" || item?.status === "ALREADY_ABSENT" ? pinterestBatch?.deletion ? "Removed" : "Ingested"
					: result.status === "PROCESSING" || item?.status === "PROCESSING" ? "Processing" : "Status unavailable";
			return { label, message: "Result of the latest save shown on this page. Ingestion confirms the catalog update; it does not confirm public Pin visibility.", destinations: [], issues, links };
		}
		if (catalog.status === "fulfilled") {
			return { label: !catalog.value ? "Not found" : issues.length ? "Catalog issues" : links.length > 1 ? "Pin available" : "Catalog item found",
				message: catalog.value ? "Pinterest returned this artwork from its US catalog." : "Pinterest did not return this artwork from its US catalog.", destinations: [], issues, links };
		}
		return unavailable(catalog.reason instanceof PinterestSyncError
			? "Pinterest catalog status could not be read with the current connection. Open Pinterest Business to inspect it; catalog lookup may require user authorization."
			: "Pinterest could not be reached. Try refreshing the status.", links);
	};
	const [googleStatus, pinterestStatus] = await Promise.all([google(), pinterest()]);
	return { google: googleStatus, pinterest: pinterestStatus, checkedAt: new Date().toISOString() };
}
