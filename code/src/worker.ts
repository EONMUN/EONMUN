import { handle } from "@astrojs/cloudflare/handler";
import { getArtworkCatalogIds, getAvailableArtworkCatalog } from "./db/catalog";
import type { Env } from "./db";
import { isGoogleMerchantConfigured, syncGoogleCatalog } from "./lib/google-merchant";

export default {
	fetch: handle,
	async scheduled(_controller, env) {
		if (!isGoogleMerchantConfigured(env)) return;
		const [artworks, ids] = await Promise.all([getAvailableArtworkCatalog(env), getArtworkCatalogIds(env)]);
		const result = await syncGoogleCatalog(env, artworks, ids);
		console.info(JSON.stringify({ message: "Google Merchant catalog refreshed", ...result }));
	},
} satisfies ExportedHandler<Env>;
