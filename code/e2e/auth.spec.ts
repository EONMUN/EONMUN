import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

test('admin sign-in starts Google through production and sign-out clears access', async ({ page, context }) => {
	await page.goto('/admin');
	await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
	let redirectURI = '';
	await page.route('https://accounts.google.com/**', route => {
		redirectURI = new URL(route.request().url()).searchParams.get('redirect_uri') ?? '';
		return route.fulfill({ body: 'Google sign-in' });
	});
	await page.getByRole('button', { name: 'Continue with Google' }).click();
	await expect(page).toHaveURL(/accounts\.google\.com/);
	expect(redirectURI).toBe('https://eonmun.com/api/auth/callback/google');
	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
	await page.goto('/admin');
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await expect(page).toHaveURL('/');
	await page.goto('/admin');
	await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
});
