import type { APIRoute } from "astro";
import { createCollectionAdmin } from "../../../../db/admin";
import { mutationError, requireAdminMutation } from "../../../../lib/admin-guard";
import { parseCollectionInput } from "../../../../lib/admin-input";
import { getRuntimeEnv } from "../../../../lib/runtime-env";

export const prerender = false;
export const POST: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv();
	const guard = await requireAdminMutation(request, env);
	if ("response" in guard) return guard.response;
	try {
		// Creation may derive a slug from the name. The update route may not: that
		// would move a published collection's public address.
		const input = parseCollectionInput(await request.json(), { deriveSlug: true });
		const collection = await createCollectionAdmin(env, input);
		return Response.json({ collection, redirect: `/admin/collections/${collection.slug}` }, { status: 201 });
	} catch (error) {
		return mutationError(error);
	}
};
