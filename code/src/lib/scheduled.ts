import { getArtworkCatalogIds, getAvailableArtworkCatalog } from "../db/catalog";
import type { Env } from "../db";
import { isGoogleMerchantConfigured, syncGoogleCatalog } from "./google-merchant";
import { dispatchAdminPush, type AdminPushEnv } from "./push/dispatch";

// CRITICAL: must match `triggers.crons` in wrangler.jsonc exactly; Cloudflare
// reports the matched expression as `controller.cron`.
export const GOOGLE_MERCHANT_CRON = "0 9 * * 1";
export const ADMIN_PUSH_CRON = "* * * * *";

async function refreshGoogleCatalog(env: Env) {
	if (!isGoogleMerchantConfigured(env)) return;
	const [artworks, ids] = await Promise.all([getAvailableArtworkCatalog(env), getArtworkCatalogIds(env)]);
	const result = await syncGoogleCatalog(env, artworks, ids);
	if (result.failed.length) console.error(JSON.stringify({ message: "Google Merchant catalog refresh partially failed", ...result }));
	else console.info(JSON.stringify({ message: "Google Merchant catalog refreshed", ...result }));
}

async function dispatchQueuedAdminPush(env: Env) {
	const summary = await dispatchAdminPush(env as AdminPushEnv);
	if (summary.claimed) console.info(JSON.stringify({ message: "Admin push dispatch", ...summary }));
}

export async function runScheduled(
	cron: string,
	env: Env,
	jobs = { googleMerchant: refreshGoogleCatalog, adminPush: dispatchQueuedAdminPush },
) {
	if (cron === GOOGLE_MERCHANT_CRON) await jobs.googleMerchant(env);
	else if (cron === ADMIN_PUSH_CRON) await jobs.adminPush(env);
	else console.warn(JSON.stringify({ message: "Unknown cron trigger", cron }));
}
