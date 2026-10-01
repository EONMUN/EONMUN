import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getRuntimeEnv } from '../../../lib/runtime-env';
import { analyticsConfigured, getTrafficReport, type AnalyticsConfig } from '../../../lib/admin-analytics';

export const prerender = false;
export const GET: APIRoute = async ({ request }) => {
	const env = getRuntimeEnv() as ReturnType<typeof getRuntimeEnv> & AnalyticsConfig;
	const headers = { 'cache-control': 'no-store' };
	// SECURITY: check admin access even on cache hits; aggregate traffic is private.
	if (!await getSession(request, env)) return Response.json({ error: 'Unauthorized' }, { status: 401, headers });
	const days = Number(new URL(request.url).searchParams.get('days') ?? 30);
	if (![7, 30, 90].includes(days)) return Response.json({ error: 'Invalid date range' }, { status: 400, headers });
	if (!analyticsConfigured(env)) return Response.json({ error: 'Analytics is not connected yet.' }, { status: 503, headers });
	try {
		const now = new Date();
		const cache = await caches.open('admin-analytics-v1');
		const key = new Request(new URL(`/__admin-analytics/${env.POSTHOG_PROJECT_ID}/${days}/${now.toISOString().slice(0, 10)}`, request.url));
		const cached = await cache.match(key);
		if (cached) return new Response(cached.body, { headers: { ...headers, 'content-type': 'application/json' } });
		const report = await getTrafficReport(env, days, now);
		await cache.put(key, Response.json(report, { headers: { 'cache-control': 'max-age=300' } })).catch(() => {});
		return Response.json(report, { headers });
	} catch {
		// Upstream errors can contain query or credential details; return only a fixed message.
		return Response.json({ error: 'Analytics is temporarily unavailable. Try again shortly.' }, { status: 502, headers });
	}
};
