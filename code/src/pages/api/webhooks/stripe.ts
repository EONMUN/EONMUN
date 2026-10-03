import type { APIRoute } from "astro";
import { waitUntil } from "cloudflare:workers";
import { getArtworkIdByProductId, markArtworkPaid } from "../../../db/checkout";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { isPinterestConfigured, syncPinterestArtwork } from "../../../lib/pinterest-sync";
import { handleStripeWebhook } from "../../../lib/stripe-webhook";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	return handleStripeWebhook(
		request,
		env.STRIPE_WEBHOOK_SECRET,
		async (eventId, productId, artworkSlug) => {
			const marked = await markArtworkPaid(env, eventId, productId, artworkSlug);
			if (isPinterestConfigured(env)) {
				waitUntil((async () => {
					const artworkId = await getArtworkIdByProductId(env, productId);
					if (artworkId === null) return;
					const batch = await syncPinterestArtwork(env, artworkId);
					if (batch.status === "FAILED" || batch.items.some((item) => item.status === "FAILURE")) {
						console.error(JSON.stringify({ message: "Pinterest sale removal failed", artworkId, batchId: batch.batch_id }));
					}
				})().catch((error) => {
					console.error(JSON.stringify({ message: "Pinterest sale removal failed", productId, error: error instanceof Error ? error.message : "Unknown error" }));
				}));
			}
			return marked;
		},
	);
};
