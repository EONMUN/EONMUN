import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

// The fixture server has no VAPID keys, so this covers the unconfigured path;
// opt-in states and delivery are covered by Bun tests with mocked push APIs.
test('notifications settings are admin-only and degrade when push is not configured', async ({ page, context, request }) => {
	const signedOut = await request.post('/api/admin/push/subscription', { data: { endpoint: 'https://web.push.apple.com/x' } });
	expect(signedOut.status()).toBe(403);
	await page.goto('/admin/notifications');
	await expect(page).toHaveURL(/\/api\/auth\/signin\?callbackUrl=%2Fadmin%2Fsettings(#notifications)?$/);

	const origin = `http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`;
	await context.addCookies(await adminCookies(origin));
	await page.goto('/admin');
	await page.getByRole('navigation', { name: 'Admin navigation', exact: true }).getByRole('link', { name: 'Settings', exact: true }).click();
	await expect(page).toHaveURL(/\/admin\/settings$/);
	const sections = page.getByRole('navigation', { name: 'Settings sections' });
	for (const [name, anchor] of [['Pinterest', '#pinterest'], ['Google Merchant', '#google'], ['Notifications', '#notifications']]) {
		await expect(sections.getByRole('link', { name, exact: true })).toHaveAttribute('href', anchor);
	}
	await sections.getByRole('link', { name: 'Notifications', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'This device', exact: true })).toBeVisible();
	await expect(page.locator('[data-push-status]')).toHaveText('Push notifications are not configured on the server yet.');
	await expect(page.getByRole('button', { name: 'Enable notifications' })).toBeHidden();
	await expect(page.getByText('No devices are enabled for your account.')).toBeVisible();
	await expect(page.getByText('No paid-order alerts yet.')).toBeVisible();
	await page.setViewportSize({ width: 390, height: 844 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	await page.screenshot({ path: 'test-results/admin-settings-mobile.png', fullPage: true });
	const unconfigured = await context.request.post('/api/admin/push/subscription', {
		headers: { origin }, data: { endpoint: 'https://web.push.apple.com/x', keys: {} },
	});
	expect(unconfigured.status()).toBe(503);
	expect(unconfigured.headers()['cache-control']).toBe('no-store');
	const worker = await request.get('/push-sw.js');
	expect(worker.ok()).toBe(true);
	expect(await worker.text()).not.toContain("addEventListener('fetch'");
});
