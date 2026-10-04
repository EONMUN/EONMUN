import type { APIRoute } from "astro";
import { waitUntil } from "cloudflare:workers";
import { getArtworkIdByProductId, markArtworkPaid } from "../../../db/checkout";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { getPinterestBatchStatus, isPinterestConfigured, syncPinterestArtwork } from "../../../lib/pinterest-sync";
import { isGoogleMerchantConfigured, syncGoogleArtwork } from "../../../lib/google-merchant";
import { handleStripeWebhook } from "../../../lib/stripe-webhook";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	return handleStripeWebhook(
		request,
		env.STRIPE_WEBHOOK_SECRET,
		async (eventId, productId, artworkSlug) => {
			const marked = await markArtworkPaid(env, eventId, productId, artworkSlug);
			// Replays retry catalog removals whose earlier background work failed.
			const pinterest = isPinterestConfigured(env);
			const google = isGoogleMerchantConfigured(env);
			const artworkIdPromise = pinterest || google ? getArtworkIdByProductId(env, productId) : Promise.resolve(null);
			if (pinterest) {
				waitUntil((async () => {
					const artworkId = await artworkIdPromise;
					if (artworkId === null) return;
					let batch = await syncPinterestArtwork(env, artworkId);
					if (batch.batch_id) {
						console.info(JSON.stringify({ message: "Pinterest sale removal submitted", artworkId, batchId: batch.batch_id }));
					}
					for (let attempt = 0; batch.status === "PROCESSING" && batch.batch_id && attempt < 3; attempt++) {
						await new Promise((resolve) => setTimeout(resolve, 3000));
						batch = await getPinterestBatchStatus(env, batch.batch_id, fetch, batch.deletionIds);
					}
					if (batch.failed) {
						console.error(JSON.stringify({ message: "Pinterest sale removal failed", artworkId, batchId: batch.batch_id }));
					} else if (batch.status === "PROCESSING") {
						console.warn(JSON.stringify({ message: "Pinterest sale removal still processing; reconcile from admin", artworkId, batchId: batch.batch_id }));
					}
				})().catch((error) => {
					console.error(JSON.stringify({ message: "Pinterest sale removal failed", productId, error: error instanceof Error ? error.message : "Unknown error" }));
				}));
			}
			if (google) {
				waitUntil((async () => {
					const artworkId = await artworkIdPromise;
					if (artworkId !== null) await syncGoogleArtwork(env, artworkId);
				})().catch((error) => {
					console.error(JSON.stringify({ message: "Google Merchant sale removal failed", productId, error: error instanceof Error ? error.message : "Unknown error" }));
				}));
			}
			return marked;
		},
	);
};
