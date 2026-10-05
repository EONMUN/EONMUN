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
	await page.getByRole('link', { name: /Settings/ }).click();
	await expect(page).toHaveURL(/\/admin\/settings$/);
	await expect(page.locator('[data-push-status]')).toHaveText('Push notifications are not configured on the server yet.');
	await expect(page.getByRole('button', { name: 'Enable notifications' })).toBeHidden();
	await expect(page.getByText('No devices are enabled for your account.')).toBeVisible();
	await expect(page.getByText('No paid-order alerts yet.')).toBeVisible();
	const unconfigured = await context.request.post('/api/admin/push/subscription', {
		headers: { origin }, data: { endpoint: 'https://web.push.apple.com/x', keys: {} },
	});
	expect(unconfigured.status()).toBe(503);
	expect(unconfigured.headers()['cache-control']).toBe('no-store');
	const worker = await request.get('/push-sw.js');
	expect(worker.ok()).toBe(true);
	expect(await worker.text()).not.toContain("addEventListener('fetch'");
});
