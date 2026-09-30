import type { APIContext } from "astro";

export const PUBLIC_CONTENT_TAG = "public-content";

// A short lifetime bounds staleness if a purge fails after a database write.
export const PUBLIC_CONTENT_RULE = {
	maxAge: 300,
	swr: 60,
	tags: [PUBLIC_CONTENT_TAG],
};

export async function invalidatePublicContent(cache: APIContext["cache"]): Promise<void> {
	if (!cache.enabled) return;
	try {
		await cache.invalidate({ tags: [PUBLIC_CONTENT_TAG] });
	} catch (error) {
		// The database write has already committed; reporting it as failed could make an admin repeat it.
		console.error("Could not invalidate the public content cache", error);
	}
}
