import type { APIRoute } from "astro";

export const prerender = false;

// TODO(checkout-pr): Stripe Checkout integration. Will create a session
// via stripe.checkout.sessions.create() using the productId in the body
// and redirect to session.url. Requires `STRIPE_SECRET_KEY` Worker secret.
// See legacy `src/app/api/checkout/` for reference shape.
export const POST: APIRoute = async () => {
	return new Response(
		JSON.stringify({
			error: "Not implemented",
			message:
				"Checkout is being migrated. See the follow-up PR that wires up Stripe Checkout sessions.",
		}),
		{
			status: 501,
			headers: { "content-type": "application/json" },
		},
	);
};
