import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

test('admin-only traffic panel renders reports and handles missing configuration and upstream failures', async ({ page, context, request }) => {
	const unauthorized = await request.get('/api/admin/analytics');
	expect(unauthorized.status()).toBe(401);
	expect(unauthorized.headers()['cache-control']).toBe('no-store');
	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
	await page.goto('/admin');
	const panel = page.locator('[data-analytics-panel]');
	await expect(panel.getByRole('status')).toHaveText('Analytics is not connected yet.');
	await expect(page.getByRole('link', { name: 'New artwork', exact: true }).first()).toBeVisible();
	const invalid = await context.request.get('/api/admin/analytics?days=999');
	expect(invalid.status()).toBe(400);
	let fail = false;
	await page.route('**/api/admin/analytics?*', route => {
		if (fail) return route.fulfill({ status: 502, json: { error: 'Unavailable' } });
		const days = Number(new URL(route.request().url()).searchParams.get('days'));
		return route.fulfill({ json: {
			days, start: '2026-09-01', end: '2026-09-30', total: 60, average: 2, changePercent: 20,
			daily: Array.from({ length: days }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, views: 2, average: 2 })),
			sources: [{ label: 'example.com', views: 40 }], countries: [{ label: 'United States', views: 50 }],
		} });
	});
	await page.reload();
	await expect(panel.locator('[data-total]')).toHaveText('60');
	await expect(panel.locator('[data-chart] rect')).toHaveCount(30);
	await expect(panel.getByText('example.com')).toBeVisible();
	await expect(panel.getByText('United States')).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	await panel.getByLabel('Traffic period').selectOption('7');
	await expect(panel.locator('[data-chart] rect')).toHaveCount(7);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	fail = true;
	await panel.getByLabel('Traffic period').selectOption('90');
	await expect(panel.getByRole('status')).toContainText('temporarily unavailable');
	await expect(panel.locator('[data-report]')).toBeHidden();
});
