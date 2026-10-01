import { expect, test } from 'bun:test';
import { analyticsConfigured, getTrafficReport } from '../src/lib/admin-analytics';

const env = { POSTHOG_PROJECT_ID: '123', POSTHOG_PERSONAL_API_KEY: 'test-only-key' };
const now = new Date('2026-10-01T18:00:00Z');

test('fills missing UTC days and computes comparable totals and seven-day averages', async () => {
	const requests: string[] = [];
	const report = await getTrafficReport(env, 7, now, (async (url, init) => {
		expect(url).toBe('https://us.posthog.com/api/projects/123/query/');
		expect(init?.redirect).toBe('manual');
		const body = JSON.parse(String(init?.body));
		requests.push(body.query.query);
		return Response.json({ results: body.name.endsWith('daily pageviews')
			? [['2026-09-23', 7], ['2026-09-24', 14], ['2026-09-30', 7]]
			: body.name.endsWith('countries') ? [['United States', 21]] : [['example.com', 21]] });
	}) as typeof fetch);
	expect(report).toMatchObject({ start: '2026-09-24', end: '2026-09-30', total: 21, average: 3, changePercent: 200 });
	expect(report.daily).toHaveLength(7);
	expect(report.daily[0]).toEqual({ date: '2026-09-24', views: 14, average: 3 });
	expect(report.daily[1].views).toBe(0);
	expect(report.daily[6].average).toBe(3);
	expect(report.sources).toEqual([{ label: 'example.com', views: 21 }]);
	for (const sql of requests) {
		expect(sql).toContain("properties.$host IN ('eonmun.com', 'www.eonmun.com')");
		expect(sql).toContain("properties.$pathname NOT LIKE '/admin/%'");
		expect(sql).toContain("timestamp < toDateTime('2026-10-01 00:00:00', 'UTC')");
	}
});

test('empty data is a genuine zero with no previous baseline', async () => {
	const report = await getTrafficReport(env, 30, now, (async () => Response.json({ results: [] })) as typeof fetch);
	expect(report.total).toBe(0);
	expect(report.changePercent).toBeNull();
	expect(report.daily).toHaveLength(30);
	expect(report.daily.every(day => day.views === 0 && day.average === 0)).toBe(true);
});

test('rejects missing configuration, unsupported ranges, redirects, and malformed upstream data', async () => {
	expect(analyticsConfigured({})).toBe(false);
	expect(analyticsConfigured({ ...env, POSTHOG_PROJECT_ID: '../other' })).toBe(false);
	await expect(getTrafficReport(env, 999, now)).rejects.toThrow('Invalid date range');
	await expect(getTrafficReport({}, 7, now)).rejects.toThrow('not configured');
	await expect(getTrafficReport(env, 7, now, (async () => new Response(null, { status: 302, headers: { location: 'https://elsewhere.test' } })) as typeof fetch)).rejects.toThrow('HTTP 302');
	await expect(getTrafficReport(env, 7, now, (async () => Response.json({ results: [['date', -1]] })) as typeof fetch)).rejects.toThrow('Invalid analytics row');
	await expect(getTrafficReport(env, 7, now, (async () => Response.json({ error: 'private upstream details' })) as typeof fetch)).rejects.toThrow('Invalid analytics response');
});
