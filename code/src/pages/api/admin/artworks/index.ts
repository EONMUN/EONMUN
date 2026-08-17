import type { APIRoute } from "astro";
import { createArtworkAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { parseArtworkInput } from "../../../../lib/admin-input";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const artwork = await createArtworkAdmin(env, parseArtworkInput(await request.json()));
		return Response.json({ artwork, redirect: `/admin/artworks/${artwork.slug}` }, { status: 201 });
	} catch (error) {
		return mutationError(error);
	}
};
