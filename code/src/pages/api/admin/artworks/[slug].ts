import type { APIRoute } from "astro";
import { getAdminArtwork, updateArtworkAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { isCurrentArtworkEditor, parseArtworkInput } from "../../../../lib/admin-input";
import { artworkContentChanged, refreshPublicContent } from "../../../../lib/cache";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
import { isPinterestConfigured, syncPinterestArtwork } from "../../../../lib/pinterest-sync";
import { isGoogleMerchantConfigured, syncGoogleArtwork } from "../../../../lib/google-merchant";

export const prerender = false;
export const POST: APIRoute = async (context) => {
	const { request, params } = context;
	if (!params.slug) return new Response("Not found", { status: 404 });
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const payload = await request.json();
        if (!isCurrentArtworkEditor(payload)) {
            return Response.json({ error: "This editor is out of date. Reload the page before saving." }, { status: 409 });
        }
        const input = parseArtworkInput(payload);
		const before = await getAdminArtwork(env, params.slug);
		const artwork = await updateArtworkAdmin(env, params.slug, input);
		if (artworkContentChanged(before, input)) {
			await refreshPublicContent(context, {
				kind: "artwork", oldSlug: params.slug, slug: artwork.slug, published: artwork.publishedAt !== null,
			});
		}
		const redirect = new URL(`/admin/artworks/${artwork.slug}`, request.url);
		if ((input.available && input.published) || (before?.publishedAt && (before.product?.quantity ?? 0) > 0)) {
			if (!isGoogleMerchantConfigured(env)) {
				redirect.searchParams.set("google", "not-connected");
			} else {
				try {
					redirect.searchParams.set("google", await syncGoogleArtwork(env, artwork.id));
				} catch (error) {
					console.error(JSON.stringify({ message: "Google Merchant artwork sync failed", artworkId: artwork.id, error: error instanceof Error ? error.message : "Unknown error" }));
					redirect.searchParams.set("google", "failed");
				}
			}
			if (!isPinterestConfigured(env)) {
				redirect.searchParams.set("pinterest", "not-connected");
			} else {
				try {
					const batch = await syncPinterestArtwork(env, artwork.id);
					if (batch.status === "FAILED" || batch.items.some((item) => item.status === "FAILURE")) {
						redirect.searchParams.set("pinterest", "failed");
					} else if (batch.batch_id) {
						redirect.searchParams.set("pinterestBatch", batch.batch_id);
					}
				} catch (error) {
					console.error(JSON.stringify({ message: "Pinterest artwork sync failed", artworkId: artwork.id, error: error instanceof Error ? error.message : "Unknown error" }));
					redirect.searchParams.set("pinterest", "failed");
				}
			}
		}
		return Response.json({ artwork, redirect: `${redirect.pathname}${redirect.search}` });
	} catch (error) {
		return mutationError(error);
	}
};
