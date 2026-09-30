import type { APIRoute } from "astro";
import { updateCollectionAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { parseCollectionInput } from "../../../../lib/admin-input";
import { invalidatePublicContent } from "../../../../lib/cache";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async ({ request, params, cache }) => {
	if (!params.slug) return new Response("Not found", { status: 404 });
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		const collection = await updateCollectionAdmin(env, params.slug, parseCollectionInput(await request.json()));
		await invalidatePublicContent(cache);
		return Response.json({ collection, redirect: `/admin/collections/${collection.slug}` });
	} catch (error) {
		return mutationError(error);
	}
};
