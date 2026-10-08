import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

test.beforeEach(async ({ context }) => {
	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
});

test('admin shell navigation and theme stay consistent across pages', async ({ page }, testInfo) => {
	await page.goto('/admin/artworks');
	const navigation = page.getByRole('navigation', { name: 'Admin navigation', exact: true });
	await expect(navigation.getByRole('link', { name: 'Artwork', exact: true })).toHaveAttribute('aria-current', 'page');
	await expect(page.getByRole('contentinfo')).toHaveCount(0);
	await page.getByText('Account', { exact: true }).click();
	await page.getByLabel('Theme', { exact: true }).selectOption('dark');
	await expect(page.locator('html')).toHaveAttribute('data-admin-theme', 'dark');
	await page.keyboard.press('Escape');
	await expect(page.locator('.account')).not.toHaveAttribute('open', '');
	await navigation.getByRole('link', { name: 'Collections', exact: true }).click();
	await expect(page.locator('html')).toHaveAttribute('data-admin-theme', 'dark');
	await page.getByText('Account', { exact: true }).click();
	await expect(page.getByLabel('Theme', { exact: true })).toHaveValue('dark');
	await page.getByLabel('Theme', { exact: true }).selectOption('system');
	await page.emulateMedia({ colorScheme: 'light' });
	await expect(page.locator('html')).toHaveAttribute('data-admin-theme', 'light');
	await page.emulateMedia({ colorScheme: 'dark' });
	await expect(page.locator('html')).toHaveAttribute('data-admin-theme', 'dark');
	await page.screenshot({ path: testInfo.outputPath('desktop.png') });
});

test('mobile navigation traps focus, closes with Escape, and navigates', async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/admin');
	const menu = page.getByRole('banner').getByRole('button', { name: 'Menu', exact: true });
	await menu.click();
	const drawer = page.getByRole('dialog', { name: 'Admin navigation' });
	await expect(drawer).toBeVisible();
	await page.keyboard.press('Shift+Tab');
	expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
	await page.keyboard.press('Escape');
	await expect(drawer).not.toBeVisible();
	await expect(menu).toBeFocused();
	await menu.click();
	await drawer.getByRole('link', { name: 'Artwork', exact: true }).click();
	await expect(page).toHaveURL('/admin/artworks');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	await page.screenshot({ path: testInfo.outputPath('mobile.png') });
});


test('sidebar remains navigable on a short desktop viewport', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 400 });
	await page.goto('/admin');
	const sidebar = page.getByRole('complementary', { name: 'Studio sidebar' });
	const website = sidebar.getByRole('link', { name: 'View website' });
	await website.scrollIntoViewIfNeeded();
	const bounds = await website.boundingBox();
	expect(bounds).not.toBeNull();
	expect(bounds!.y).toBeGreaterThanOrEqual(0);
	expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(400);
	await sidebar.getByRole('link', { name: 'Settings', exact: true }).click();
	await expect(page).toHaveURL('/admin/settings');
});
