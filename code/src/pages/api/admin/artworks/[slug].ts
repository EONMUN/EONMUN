import type { APIRoute } from "astro";
import { updateArtworkAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { parseArtworkInput } from "../../../../lib/admin-input";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async ({ request, params }) => {
	if (!params.slug) return new Response("Not found", { status: 404 });
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const artwork = await updateArtworkAdmin(env, params.slug, parseArtworkInput(await request.json()));
		return Response.json({ artwork, redirect: `/admin/artworks/${artwork.slug}` });
	} catch (error) {
		return mutationError(error);
	}
};
