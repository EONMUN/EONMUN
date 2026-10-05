import type { APIRoute } from "astro";
import { createArtworkAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { isCurrentArtworkEditor, parseArtworkInput } from "../../../../lib/admin-input";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async (context) => {
	const { request } = context;
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const payload = await request.json();
        if (!isCurrentArtworkEditor(payload)) {
            return Response.json({ error: "This editor is out of date. Reload the page before saving." }, { status: 409 });
        }
        const artwork = await createArtworkAdmin(env, parseArtworkInput(payload, { deriveSlug: true }));
		return Response.json({ artwork, redirect: `/admin/artworks/${artwork.slug}` }, { status: 201 });
	} catch (error) {
		return mutationError(error);
	}
};
