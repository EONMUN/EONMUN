import { expect, test } from '@playwright/test';
import { encode } from '@auth/core/jwt';

async function visit(page: import('@playwright/test').Page, path: string) {
	await expect(async () => { await page.goto(path, { waitUntil: 'domcontentloaded' }); }).toPass({ timeout: 10_000 });
}

test('admin creates, lists, edits, and publishes an artwork', async ({ page, context }) => {
	const token = await encode({
		token: { sub: 'playwright-admin', email: 'ncrmro@gmail.com', name: 'Playwright Admin' },
		secret: 'eonmun-playwright-only-secret', salt: 'authjs.session-token',
	});
	await context.addCookies([{ name: 'authjs.session-token', value: token, url: 'http://127.0.0.1:' + process.env.EONMUN_E2E_PORT }]);

	const slug = `playwright-artwork-${Date.now()}`;
	await visit(page, '/admin/artworks/new');
	await page.getByRole('textbox', { name: 'Title' }).fill('Playwright artwork');
	await page.getByRole('textbox', { name: 'Slug' }).fill(slug);
	await page.getByRole('textbox', { name: 'Artist' }).fill('EONMUN');
	await page.getByRole('button', { name: 'Save artwork' }).click();
	await expect(page).toHaveURL(`/admin/artworks/${slug}`);

	await visit(page, '/admin/artworks');
	await expect(page.locator(`a[href="/admin/artworks/${slug}"]`)).toBeVisible();
	await page.locator(`a[href="/admin/artworks/${slug}"]`).click();
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
});

test('buyer can start checkout for available artwork without seeing its price', async ({ page }) => {
	let submittedSlug: string | null = null;
	await page.route('**/api/checkout', async (route) => {
		const request = route.request();
		expect(request.method()).toBe('POST');
		submittedSlug = new URLSearchParams(request.postData() ?? '').get('artworkSlug');
		await route.fulfill({ status: 303, headers: { location: '/artworks/limones-del-cobre?checkout=e2e' } });
	});
	await visit(page, '/artworks/limones-del-cobre');
	await expect(page.getByRole('heading', { name: 'Limones del Cobre' })).toBeVisible();
	await expect(page.getByText('$1,400')).toHaveCount(0);
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
