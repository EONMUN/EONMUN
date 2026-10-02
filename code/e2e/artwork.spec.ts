import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

async function visit(page: import('@playwright/test').Page, path: string) {
	await expect(async () => { await page.goto(path, { waitUntil: 'domcontentloaded' }); }).toPass({ timeout: 10_000 });
}

test('admin creates, lists, edits, and publishes an artwork', async ({ page, context }) => {
	await context.addCookies(await adminCookies('http://127.0.0.1:' + process.env.EONMUN_E2E_PORT));

	const slug = `playwright-artwork-${Date.now()}`;
	await visit(page, '/admin/artworks/new');
	await page.getByRole('textbox', { name: 'Title' }).fill('Playwright artwork');
	await page.getByRole('textbox', { name: 'Slug' }).fill(slug);
	await page.getByRole('textbox', { name: 'Artist' }).fill('EONMUN');
	await page.getByRole('spinbutton', { name: 'Price (USD)' }).fill('1250');
	await page.getByRole('textbox', { name: 'Tags' }).fill('bird, watercolor');
	await page.getByRole('combobox', { name: 'Facet key' }).fill('size');
	await page.getByRole('textbox', { name: 'Facet value' }).fill('Small');
	await page.getByRole('button', { name: 'Add facet' }).click();
	await page.getByRole('button', { name: 'Save artwork' }).click();
	await expect(page).toHaveURL(`/admin/artworks/${slug}`);

	await visit(page, '/admin/artworks');
	await expect(page.locator(`a[href="/admin/artworks/${slug}"]`)).toBeVisible();
	await page.locator(`a[href="/admin/artworks/${slug}"]`).click();
	await expect(page.getByRole('spinbutton', { name: 'Price (USD)' })).toHaveValue('1250.00');
	await page.getByRole('textbox', { name: 'Title' }).fill('Playwright artwork edited');
	await page.getByRole('checkbox', { name: 'Published' }).check();
	await page.getByRole('button', { name: 'Save artwork' }).click();
	await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Playwright artwork edited');
	await expect(page.getByRole('checkbox', { name: 'Published' })).toBeChecked();

	await visit(page, '/artworks');
	await expect(async () => {
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator(`a[href="/artworks/${slug}"]`)).toBeVisible();
	}).toPass({ timeout: 15_000 });
	await visit(page, `/artworks/${slug}`);
	await expect(page.getByRole('heading', { name: 'Playwright artwork edited' })).toBeVisible();
	await expect(page.locator('[aria-label="Artwork facets"]')).toContainText('bird');
	await expect(page.locator('[aria-label="Artwork facets"]')).toContainText('size: Small');
	await expect(page.getByText('Not currently available for purchase.')).toBeVisible();
	await expect(page.locator('[data-artwork-price]')).toHaveCount(0);
	expect(await page.locator('script[type="application/ld+json"]').count()).toBe(0);
});

test('buyer sees the checkout price and an initial offer before starting checkout', async ({ page, request }) => {
	let submittedSlug: string | null = null;
	const html = await (await request.get('/artworks/limones-del-cobre')).text();
	expect(html).toContain('$1,400.00 USD');
	expect(html).toContain('"priceCurrency":"USD","price":"1400.00","availability":"https://schema.org/InStock"');
	expect(html).toMatch(/<form[^>]+data-buy-form/);
	await page.route('**/api/checkout', async (route) => {
		const request = route.request();
		expect(request.method()).toBe('POST');
		submittedSlug = new URLSearchParams(request.postData() ?? '').get('artworkSlug');
		await route.fulfill({ status: 303, headers: { location: '/artworks/limones-del-cobre?checkout=e2e' } });
	});
	await visit(page, '/artworks/limones-del-cobre');
	await expect(page.getByRole('heading', { name: 'Limones del Cobre' })).toBeVisible();
	await expect(page.locator('[data-artwork-price]')).toHaveText('$1,400.00 USD');
	await page.getByRole('button', { name: 'Buy' }).click();
	await expect(page).toHaveURL(/checkout=e2e/);
	expect(submittedSlug).toBe('limones-del-cobre');
});

test('inventory and payment endpoints are never cacheable', async ({ request }) => {
	const inventory = await request.get('/api/inventory/limones-del-cobre.json');
	const checkout = await request.post('/api/checkout', { data: { artworkSlug: 'invalid slug' } });
	const webhook = await request.post('/api/webhooks/stripe', { data: '{}' });
	for (const response of [inventory, checkout, webhook]) {
		expect(response.headers()['cache-control']).toBe('no-store');
	}
});

test('artwork and post filters share legible light and dark styles', async ({ page }) => {
	for (const colorScheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme });
		const colors = async (path: string) => {
			await page.goto(path, { waitUntil: 'load' });
			await expect(page.locator('[data-filter-chip]').nth(1)).toBeVisible();
			return page.locator('[data-filter-chip]').evaluateAll((chips) =>
				chips.slice(0, 2).map((chip) => ({
					text: getComputedStyle(chip).color,
					background: getComputedStyle(chip).backgroundColor,
				})),
			);
		};
		const artwork = await colors('/artworks');
		const posts = await colors('/posts');
		expect(artwork).toHaveLength(2);
		expect(artwork).toEqual(posts);
		if (colorScheme === 'dark') expect(artwork[1].text).toBe('rgb(255, 255, 255)');
	}
	await page.goto('/artworks?collection=botanica', { waitUntil: 'load' });
	await expect(page.locator('[data-filter-chip][aria-current="page"]')).toHaveText('Botánica');
	await page.goto('/posts?type=announcement', { waitUntil: 'load' });
	await expect(page.locator('[data-filter-chip][aria-current="page"]')).toHaveText('Announcements');
});

test('site chrome follows the active theme and contact uses email', async ({ page }) => {
	for (const colorScheme of ['light', 'dark'] as const) {
		await page.emulateMedia({ colorScheme });
		await page.goto('/contact', { waitUntil: 'load' });
		const wordmarkColor = await page.locator('nav > a[href="/"]').evaluate((link) => getComputedStyle(link).color);
		const bodyColor = await page.locator('body').evaluate((body) => getComputedStyle(body).color);
		expect(wordmarkColor).toBe(bodyColor);
		await expect(page.getByRole('link', { name: 'contact@eonmun.com' })).toHaveAttribute('href', 'mailto:contact@eonmun.com');
		await expect(page.locator(`meta[name="theme-color"][media="(prefers-color-scheme: ${colorScheme})"]`))
			.toHaveAttribute('content', colorScheme === 'dark' ? '#111827' : '#ffffff');
	}
});
