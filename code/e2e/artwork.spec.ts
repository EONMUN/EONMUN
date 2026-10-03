import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

async function visit(page: import('@playwright/test').Page, path: string) {
	await expect(async () => { await page.goto(path, { waitUntil: 'domcontentloaded' }); }).toPass({ timeout: 10_000 });
}

test('admin creates, lists, edits, and publishes an artwork', async ({ page, context }) => {
	await context.addCookies(await adminCookies('http://127.0.0.1:' + process.env.EONMUN_E2E_PORT));

	const slug = 'suggest';
	await visit(page, '/admin/artworks/new');
	await page.getByRole('textbox', { name: 'Title' }).fill('Playwright artwork');
	await page.getByRole('textbox', { name: 'Slug' }).fill(slug);
	await page.getByRole('textbox', { name: 'Artist' }).fill('EONMUN');
	await page.getByRole('spinbutton', { name: 'Price (USD)' }).fill('1250');
	await page.getByRole('textbox', { name: 'Tags' }).fill('bird, watercolor');
    await expect(page.getByRole('group',{name:'Dimensions',exact:true})).toBeVisible();
    await expect(page.getByRole('group',{name:'Materials and surface',exact:true})).toBeVisible();
    await expect(page.getByRole('textbox',{name:'Facet value'})).toHaveCount(0);
    await page.getByRole('spinbutton',{name:'Width',exact:true}).fill('12');
    await page.getByRole('spinbutton',{name:'Height',exact:true}).fill('16');
    await page.getByRole('combobox',{name:'Unit',exact:true}).selectOption('in');
    await page.getByRole('textbox',{name:'Add materials',exact:true}).fill('Ink wash');
    await expect(page.getByRole('combobox',{name:'Size',exact:true})).toHaveCount(0);
    await expect(page.getByRole('combobox',{name:'Orientation',exact:true})).toBeDisabled();
	await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}), page.getByRole('button', { name: 'Save artwork' }).click()]);
	await expect(page).toHaveURL(`/admin/artworks/${slug}`);

	await visit(page, '/admin/artworks');
	await expect(page.locator(`a[href="/admin/artworks/${slug}"]`)).toBeVisible();
	await page.locator(`a[href="/admin/artworks/${slug}"]`).click();
	await expect(page.getByRole('spinbutton', { name: 'Price (USD)' })).toHaveValue('1250.00');
	await expect(page.getByRole('checkbox',{name:'Ink wash',exact:true})).toBeChecked();
    await expect(page.getByRole('spinbutton',{name:'Width',exact:true})).toHaveValue('12');
    await page.getByRole('textbox', { name: 'Title' }).fill('Playwright artwork edited');
	await page.getByRole('checkbox', { name: 'Published' }).check();
	await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}), page.getByRole('button', { name: 'Save artwork' }).click()]);
	await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Playwright artwork edited');
    await page.getByRole('spinbutton',{name:'Width',exact:true}).fill('0');
    await page.getByRole('spinbutton',{name:'Height',exact:true}).fill('');
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}), page.getByRole('button', { name: 'Save artwork' }).click()]);
    await visit(page, `/artworks/${slug}`);
    await expect(page.locator('[aria-label="Artwork dimensions"]')).toContainText('0 in');
    await visit(page, `/admin/artworks/${slug}`);
    await page.getByRole('spinbutton',{name:'Width',exact:true}).fill('12');
    await page.getByRole('spinbutton',{name:'Height',exact:true}).fill('16');
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}), page.getByRole('button', { name: 'Save artwork' }).click()]);
	await expect(page.getByRole('checkbox', { name: 'Published' })).toBeChecked();
    const staleSaves = await page.evaluate(async () => Promise.all(['/api/admin/artworks/suggest', '/api/admin/artworks'].map(async endpoint => {
        const response = await fetch(endpoint, {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({title:'Stale edit',slug:'suggest',width:12,height:16,tags:[],facetIds:[],newFacets:[]})});
        return response.status;
    })));
    expect(staleSaves).toEqual([409, 409]);

	await visit(page, '/artworks');
	await expect(async () => {
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator(`a[href="/artworks/${slug}"]`)).toBeVisible();
	}).toPass({ timeout: 15_000 });
	await visit(page, `/artworks/${slug}`);
	await expect(page.getByRole('heading', { name: 'Playwright artwork edited' })).toBeVisible();
	await expect(page.locator('[aria-label="Artwork tags"]')).toContainText('bird');
	await expect(page.locator('[aria-label="Artwork tags"]')).not.toContainText('size:');
	await expect(page.locator('[aria-label="Artwork dimensions"]')).toContainText('12 in');
	await expect(page.getByRole('region',{name:'Orientation',exact:true})).toContainText('Portrait');
    await expect(page.locator('[aria-label="Artwork tags"]')).not.toContainText('Portrait');
    await expect(page.getByRole('region',{name:'Materials',exact:true})).toContainText('Ink wash');
    await expect(page.locator('[aria-label="Artwork tags"]')).not.toContainText('Ink wash');
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


test('orientation filters are separate, shareable, and work in collections', async ({page}) => {
    await page.goto('/artworks?orientation=portrait');
    const filter = page.getByRole('combobox',{name:'Orientation',exact:true});
    const cards = page.locator('[data-artwork-card]:visible');
    await expect(filter).toHaveValue('portrait');
    expect(await cards.count()).toBeGreaterThan(0);
    expect(await cards.evaluateAll(items => items.every(item => (item as HTMLElement).dataset.orientation === 'portrait'))).toBe(true);
    await page.getByRole('link',{name:'Botánica',exact:true}).click();
    await expect(page).toHaveURL('/collections/botanica?orientation=portrait');
    await expect(filter).toHaveValue('portrait');
    expect(await cards.count()).toBeGreaterThan(0);
    await filter.selectOption('landscape');
    await expect(page).toHaveURL(/orientation=landscape/);
    await expect(cards).toHaveCount(0);
    await expect(page.getByText('No artworks match this orientation.')).toBeVisible();
    await page.reload();
    await expect(filter).toHaveValue('landscape');
    await filter.selectOption('');
    await expect(page).toHaveURL('/collections/botanica');
    await page.goBack();
    await expect(filter).toHaveValue('landscape');
    await page.goto('/artworks?collection=botanica&orientation=portrait');
    await expect(page).toHaveURL('/collections/botanica?orientation=portrait');
    await expect(filter).toHaveValue('portrait');
    await page.goto('/artworks?orientation=invalid');
    await expect(filter).toHaveValue('');
    expect(await cards.count()).toBeGreaterThan(0);
});


test('custom orientations remain selected in collections without matches', async ({page,context}) => {
    await context.addCookies(await adminCookies('http://127.0.0.1:' + process.env.EONMUN_E2E_PORT));
    await page.goto('/admin/artworks');
    const saved = await page.evaluate(async () => {
        const body = JSON.stringify({
            editorVersion:2,title:'Panoramic study',slug:'panoramic-study',published:true,orientation:'Panoramic',
            tags:[],materials:[],supports:[],mediums:[],subjects:[],styles:[],colors:[],images:[],collectionIds:[]
        });
        const options = {method:'POST',headers:{'content-type':'application/json'},body};
        const created = await fetch('/api/admin/artworks',options);
        if (!created.ok) return false;
        return (await fetch('/api/admin/artworks/panoramic-study',options)).ok;
    });
    expect(saved).toBe(true);
    await page.goto('/artworks?orientation=panoramic');
    const filter = page.getByRole('combobox',{name:'Orientation',exact:true});
    await expect(filter).toHaveValue('panoramic');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(1);
    await page.getByRole('link',{name:'Botánica',exact:true}).click();
    await expect(filter).toHaveValue('panoramic');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(0);
    await expect(page.getByText('No artworks match this orientation.')).toBeVisible();
    await page.getByRole('link',{name:'All',exact:true}).click();
    await expect(filter).toHaveValue('panoramic');
    await expect(page.locator('[data-artwork-card]:visible')).toHaveCount(1);
});
