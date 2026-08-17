import type { APIRoute } from "astro";
import { markArtworkPaid } from "../../../db/checkout";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { handleStripeWebhook } from "../../../lib/stripe-webhook";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	return handleStripeWebhook(
		request,
		env.STRIPE_WEBHOOK_SECRET,
		(eventId, productId, artworkSlug) => markArtworkPaid(env, eventId, productId, artworkSlug),
	);
};
