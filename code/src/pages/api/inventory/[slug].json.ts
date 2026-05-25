import type { APIRoute } from "astro";

import { getProductAvailabilityBySlug } from "../../../db/queries";
import { getRuntimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	const slug = params.slug;
	if (!slug) {
		return new Response("Not found", { status: 404 });
	}

	const env = getRuntimeEnv();
	const availability = await getProductAvailabilityBySlug(env, slug);
	if (!availability) {
		return new Response("Not found", { status: 404 });
	}

	return Response.json(availability, {
		headers: {
			"cache-control": "no-store",
		},
	});
};
