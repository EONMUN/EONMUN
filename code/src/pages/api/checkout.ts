import type { APIRoute } from "astro";
import { getCheckoutItemByArtworkSlug } from "../../db/checkout";
import { handleCheckoutRequest } from "../../lib/checkout";
import { getRuntimeEnv } from "../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	return handleCheckoutRequest(
		request,
		env.STRIPE_SECRET_KEY,
		(slug) => getCheckoutItemByArtworkSlug(env, slug),
	);
};
