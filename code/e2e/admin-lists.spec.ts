import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

test.beforeEach(async ({ context }) => {
	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
});

test('title search combines independent publication and sale filters and can be cleared', async ({ page }, testInfo) => {
	await page.goto('/admin/artworks');
	const rows = page.locator('[data-artwork-row]');
	const total = await rows.count();
	expect(total).toBeGreaterThan(0);
	const title = await rows.first().locator('.card-title').innerText();
	const publication = await rows.first().locator('.item-states span').nth(0).innerText();
	const sale = await rows.first().locator('.item-states span').nth(1).innerText();
	await page.getByLabel('Search titles').fill(title);
	await page.getByRole('combobox', { name: 'Publication', exact: true }).selectOption(publication.toLowerCase());
	await page.getByRole('combobox', { name: 'Sale status', exact: true }).selectOption(sale === 'Not for sale' ? 'not-for-sale' : sale.toLowerCase());
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await expect(rows).toHaveCount(1);
	await expect(rows.first()).toContainText(title);
	await expect(page.getByLabel('Search titles')).toHaveValue(title);
	await page.getByRole('combobox', { name: 'Publication', exact: true }).selectOption(publication === 'Published' ? 'draft' : 'published');
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await expect(rows).toHaveCount(0);
	await expect(page.getByText('No artwork matches these filters.')).toBeVisible();
	await page.getByRole('link', { name: 'Clear filters' }).click();
	await expect(rows).toHaveCount(total);
	await expect(page.getByRole('combobox', { name: 'Publication', exact: true })).toHaveValue('');
	await expect(page.getByRole('combobox', { name: 'Sale status', exact: true })).toHaveValue('');
	await page.screenshot({ path: testInfo.outputPath('artwork-list-desktop.png') });
	await page.setViewportSize({ width: 375, height: 812 });
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	await page.screenshot({ path: testInfo.outputPath('artwork-list-mobile.png') });
});

test('private artwork searches omit analytics and Pinterest tracking', async ({ page }) => {
	const publicHtml = await (await page.request.get('/artworks')).text();
	expect(publicHtml).toContain('Analytics.astro');
	expect(publicHtml).toContain('pintrk');
	const response = await page.request.get('/admin/artworks?q=Private%20draft%20title&publication=draft');
	expect(response.status()).toBe(200);
	expect(response.headers()['cache-control']).toBe('no-store');
	const html = await response.text();
	expect(html).toContain('Private draft title');
	expect(html).not.toContain('Analytics.astro');
	expect(html).not.toContain('pintrk');
});

test('overview shows recent sale details, repository posts and compact orders access', async ({ page }) => {
	await page.goto('/admin');
	await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Private sales' })).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Repository posts' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'View paid orders →' })).toHaveAttribute('href', '/admin/orders');
	await expect(page.locator('.item-states').first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'New artwork', exact: true })).toHaveCount(1);
});

test('collection stack supports keyboard focus and shows its artwork count', async ({ page }) => {
	await page.goto('/admin/collections');
	const card = page.locator('a.card').filter({ has: page.locator('.stack .layer-1') }).first();
	await expect(card).toBeVisible();
	await card.focus();
	await expect(card).toBeFocused();
	await expect(card.locator('.layer-1')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
	await expect(card.locator('.card-meta')).toContainText(/artworks?/);
});

test('touch collection cards show the cover and count without hover', async ({ browser }) => {
	const baseURL = `http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`;
	const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
	try {
		await context.addCookies(await adminCookies(baseURL));
		const page = await context.newPage();
		await page.goto('/admin/collections');
		const card = page.locator('a.card').filter({ has: page.locator('.stack .layer-1') }).first();
		await expect(card.locator('.layer-0')).toBeVisible();
		await expect(card.locator('.layer-1')).toBeHidden();
		await expect(card.locator('.card-meta')).toContainText(/artworks?/);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	} finally { await context.close(); }
});
