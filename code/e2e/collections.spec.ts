import { expect, test } from '@playwright/test';

test('collection pages show their artwork and preserve the collection on detail links', async ({ page, request }) => {
	await page.goto('/artworks');
	await page.getByRole('link', { name: 'Botánica', exact: true }).click();
	await expect(page).toHaveURL('/collections/botanica');
	await expect(page.getByRole('heading', { name: 'Botánica', exact: true })).toBeVisible();
	const cards = page.locator('[data-artwork-card]');
	await expect(cards).toHaveCount(2);
	expect(await cards.evaluateAll(links => links.map(link => link.getAttribute('href')).sort())).toEqual([
		'/artworks/camelia?collection=botanica', '/artworks/occullilium?collection=botanica',
	]);
	await cards.first().click();
	await expect(page).toHaveURL(/\/artworks\/[^?]+\?collection=botanica$/);
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/artworks\/[^?]+$/);
	await page.getByRole('link', { name: 'Botánica', exact: true }).click();
	await expect(page).toHaveURL('/collections/botanica');

	await page.goto('/artworks?collection=botanica');
	await expect(page).toHaveURL('/collections/botanica');
	expect((await request.get('/collections/not-a-real-collection')).status()).toBe(404);
	const sitemap = await (await request.get('/sitemap.xml')).text();
	expect(sitemap).toContain('/collections/botanica</loc>');
});
