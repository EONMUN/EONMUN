import type { APIRoute } from "astro";
import { getAdminArtwork, updateArtworkAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { parseArtworkInput } from "../../../../lib/admin-input";
import { artworkContentChanged, refreshPublicContent } from "../../../../lib/cache";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async (context) => {
	const { request, params } = context;
	if (!params.slug) return new Response("Not found", { status: 404 });
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const input = parseArtworkInput(await request.json());
		const before = await getAdminArtwork(env, params.slug);
		const artwork = await updateArtworkAdmin(env, params.slug, input);
		if (artworkContentChanged(before, input)) {
			await refreshPublicContent(context, {
				kind: "artwork", oldSlug: params.slug, slug: artwork.slug, published: artwork.publishedAt !== null,
			});
		}
		return Response.json({ artwork, redirect: `/admin/artworks/${artwork.slug}` });
	} catch (error) {
		return mutationError(error);
	}
};
