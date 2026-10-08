import type { APIRoute } from "astro";
import { FacetConflict, mutateFacet } from "../../../../db/facet-admin";
import { requireAdminMutation } from "../../../../lib/admin-guard";
import { parseFacetMutation } from "../../../../lib/facet-input";
import { refreshPublicContent } from "../../../../lib/cache";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
export const prerender = false;
export const POST: APIRoute = async (context) => {
	const env = getRuntimeEnv();
	const reply = (data: unknown, status = 200) =>
		Response.json(data, { status, headers: { "cache-control": "no-store" } });
	const access = await requireAdminMutation(context.request, env);
	if ("response" in access) {
		access.response.headers.set("cache-control", "no-store");
		return access.response;
	}
	try {
		const affected = await mutateFacet(
			env,
			parseFacetMutation(await context.request.json()),
		);
		for (const artwork of affected)
			await refreshPublicContent(context, {
				kind: "artwork",
				oldSlug: artwork.slug,
				slug: artwork.slug,
				published: artwork.publishedAt !== null,
			});
		return reply({ saved: true });
	} catch (error) {
		return reply(
			{
				error: error instanceof Error ? error.message : "Could not save facet",
			},
			error instanceof FacetConflict ? 409 : 400,
		);
	}
};
