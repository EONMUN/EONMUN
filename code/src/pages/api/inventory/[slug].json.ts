import type { APIRoute } from "astro";

import { getProductAvailabilityBySlug } from "../../../db/queries";
import { getRuntimeEnv } from "../../../lib/runtime-env";
import { getPublishedProductBySlug } from "../../../lib/product-content";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response("Not found", { status: 404 });
	}

	try {
		const env = getRuntimeEnv();
		const availability = await getProductAvailabilityBySlug(env, slug);
		if (availability) {
			return Response.json(availability, {
				headers: {
					"cache-control": "no-store",
				},
			});
		}
	} catch {}

	const fallbackProduct = await getPublishedProductBySlug(slug);
	if (!fallbackProduct) {
		return new Response("Not found", { status: 404 });
	}

	const available = fallbackProduct.data.quantity !== 0;

	return Response.json({
		slug: fallbackProduct.id,
		type: fallbackProduct.data.type,
		available,
		status: available ? "available" : "sold",
	}, {
		headers: {
			"cache-control": "no-store",
		},
	});
};
