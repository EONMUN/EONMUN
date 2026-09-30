import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	const path = context.url.pathname;
	if (path !== "/admin" && !path.startsWith("/admin/") && !path.startsWith("/api/")) {
		return next();
	}

	context.cache.set(false);
	const response = await next();
	const headers = new Headers(response.headers);
	headers.set("cache-control", "no-store");
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
