import type { APIRoute } from "astro";
import { getAdminArtworks, getAdminCollection, updateCollectionAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { parseCollectionInput } from "../../../../lib/admin-input";
import { collectionContentChanged, refreshPublicContent } from "../../../../lib/cache";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async (context) => {
	const { request, params } = context;
	if (!params.slug) return new Response("Not found", { status: 404 });
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const input = parseCollectionInput(await request.json());
		const before = await getAdminCollection(env, params.slug);
		const collection = await updateCollectionAdmin(env, params.slug, input);
		if (collectionContentChanged(before, input)) {
			const memberIds = new Set([...(before?.artworkIds ?? []), ...input.artworkIds]);
			const memberSlugs = (await getAdminArtworks(env))
				.filter(({ id }) => memberIds.has(id))
				.map(({ slug }) => slug);
			await refreshPublicContent(context, {
				kind: "collection", oldSlug: params.slug, slug: collection.slug, memberSlugs,
			});
		}
		return Response.json({ collection, redirect: `/admin/collections/${collection.slug}` });
	} catch (error) {
		return mutationError(error);
	}
};
