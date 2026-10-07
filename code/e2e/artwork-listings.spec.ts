import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

const endpoint = '/api/admin/artworks/limones-del-cobre/listings';

test('listing status requires an admin session and a same-origin request', async ({ request, context }) => {
	const origin = `http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`;
	const anonymous = await request.post(endpoint, { headers: { origin }, data: {} });
	expect(anonymous.status()).toBe(401);
	expect(anonymous.headers()['cache-control']).toBe('no-store');
	await context.addCookies(await adminCookies(origin));
	const foreign = await context.request.post(endpoint, { headers: { origin: 'https://other.example' }, data: {} });
	expect(foreign.status()).toBe(403);
	const result = await context.request.post(endpoint, { headers: { origin }, data: {} });
	expect(result.status()).toBe(200);
	expect(result.headers()['cache-control']).toBe('no-store');
	expect((await result.json()).google.label).toBe('Not connected');
	const invalid = await context.request.post(endpoint, { headers: { origin }, data: { pinterestBatchId: '../other' } });
	expect(invalid.status()).toBe(400);
});

test('artwork editor shows review status, issues, links, and refreshes without saving', async ({ page, context }, testInfo) => {
	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
	let checks = 0;
	let approved = false;
	await page.route(`**${endpoint}`, async (route) => {
		checks++;
		await route.fulfill({ json: {
			google: { label: approved ? 'Approved' : 'In review', message: 'US eligibility', destinations: [{ label: 'Free listings', status: approved ? 'Approved' : 'In review' }],
				issues: approved ? [] : [{ message: 'Image <img src=x> is being reviewed', url: 'https://support.google.com/merchants/answer/123' }],
				links: [{ label: 'Open Merchant Center', url: 'https://merchants.google.com/mc/products?a=123' }] },
			pinterest: { label: 'Pin available', message: 'US catalog item', destinations: [], issues: [], links: [{ label: 'View Product Pin', url: 'https://www.pinterest.com/pin/123456/' }] },
			checkedAt: '2026-10-06T16:00:00Z',
		} });
	});
	await page.goto('/admin/artworks/limones-del-cobre');
	const panel = page.getByRole('group', { name: 'Listings', exact: true });
	const images = page.getByRole('group', { name: 'Images', exact: true });
	await expect(images.locator('[data-image-list] img')).not.toHaveCount(0);
	const preview = images.locator('[data-image-list] img').first();
	await expect(preview).toHaveJSProperty('complete', true);
	await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
	const previewBox = await preview.boundingBox();
	const detailsBox = await images.locator('.artwork-image-details').first().boundingBox();
	expect(Math.abs(previewBox!.y - detailsBox!.y)).toBeLessThan(1);
	await expect(preview).toHaveCSS('object-position', '50% 0%');
	expect(previewBox!.width).toBeGreaterThan(600);
	expect(previewBox!.height).toBeGreaterThan(400);
	await expect(images.getByText('Alt text', { exact: true }).first()).toBeVisible();
	await preview.scrollIntoViewIfNeeded();
	await page.screenshot({ path: testInfo.outputPath('artwork-desktop.png') });
	const imagesBox = await images.boundingBox();
	const pieceBox = await page.getByRole('group', { name: 'Piece', exact: true }).boundingBox();
	const formBox = await page.locator('[data-admin-artwork-form]').boundingBox();
	const listingsBox = await panel.boundingBox();
	expect(imagesBox!.y + imagesBox!.height).toBeLessThanOrEqual(pieceBox!.y);
	expect(formBox!.y + formBox!.height).toBeLessThanOrEqual(listingsBox!.y);
	await expect(panel.locator('[data-listing-label]').first()).toHaveText('In review');
	await expect(panel.locator('[data-listing-issues]')).toContainText(['Image <img src=x> is being reviewed', '']);
	await expect(panel.locator('img')).toHaveCount(0);
	await expect(panel.getByRole('link', { name: 'View Product Pin' })).toHaveAttribute('href', 'https://www.pinterest.com/pin/123456/');
	await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Unsaved title');
	const initialChecks = checks;
	approved = true;
	await panel.getByRole('button', { name: 'Refresh status' }).click();
	await expect(panel.locator('[data-listing-label]').first()).toHaveText('Approved');
	await expect(panel.locator('[data-listing-issues]').first()).toBeHidden();
	await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Unsaved title');
	expect(checks).toBe(initialChecks + 1);
	await page.setViewportSize({ width: 390, height: 844 });
	const mobilePreview = await preview.boundingBox();
	const mobileDetails = await images.locator('.artwork-image-details').first().boundingBox();
	expect(mobilePreview!.width).toBeGreaterThan(280);
	expect(mobileDetails!.y).toBeGreaterThanOrEqual(mobilePreview!.y + mobilePreview!.height);
	await expect(page.locator('body')).toHaveJSProperty('scrollWidth', 390);
	await preview.scrollIntoViewIfNeeded();
	await page.screenshot({ path: testInfo.outputPath('artwork-mobile.png') });
});
