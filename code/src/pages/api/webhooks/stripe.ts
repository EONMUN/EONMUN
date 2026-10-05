import type { APIRoute } from "astro";
import { waitUntil } from "cloudflare:workers";
import { recordPaidOrder } from "../../../db/orders";
import { enqueueAdminOrderNotification } from "../../../lib/admin-order-notifications";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { getPinterestBatchStatus, isPinterestConfigured, syncPinterestArtwork } from "../../../lib/pinterest-sync";
import { isGoogleMerchantConfigured, syncGoogleArtwork } from "../../../lib/google-merchant";
import { fetchCheckoutLineItemTitle } from "../../../lib/stripe-order";
import { handleStripeWebhook } from "../../../lib/stripe-webhook";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	return handleStripeWebhook(
		request,
		env.STRIPE_WEBHOOK_SECRET,
		async (checkout) => {
			// Every paid delivery, including a replay, resolves to the same stored
			// order; order.notification is { orderId, artworkTitle, amountTotal, currency }.
			const secretKey = env.STRIPE_SECRET_KEY;
			const order = await recordPaidOrder(env, checkout, secretKey ? (sessionId) => fetchCheckoutLineItemTitle(secretKey, sessionId) : null);
			const { artworkId } = order;
			// Replays retry catalog removals whose earlier background work failed.
			if (artworkId !== null && isPinterestConfigured(env)) {
				waitUntil((async () => {
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
					console.error(JSON.stringify({ message: "Pinterest sale removal failed", artworkId, error: error instanceof Error ? error.message : "Unknown error" }));
				}));
			}
			if (artworkId !== null && isGoogleMerchantConfigured(env)) {
				waitUntil(syncGoogleArtwork(env, artworkId).catch((error) => {
					console.error(JSON.stringify({ message: "Google Merchant sale removal failed", artworkId, error: error instanceof Error ? error.message : "Unknown error" }));
				}));
			}
			return order;
		},
		// Disabled push (`not_configured`) and delivery failures never fail the webhook;
		// delivery retries stay in the alert queue.
		{ notifyAdmins: (order) => enqueueAdminOrderNotification(env, order.notification) },
	);
};
