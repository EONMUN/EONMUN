import { expect, test } from '@playwright/test';
import sharp from 'sharp';

async function imageResponse(url: string, background = '#222') {
	const params = new URL(url).searchParams;
	const width = Number(params.get('w') ?? 1920);
	const height = Number(params.get('h') ?? Math.round(width / 1.6));
	// Chromium needs the mock's dimensions to match the srcset candidate.
	const body = await sharp({ create: { width, height, channels: 3, background } }).webp({ lossless: true }).toBuffer();
	return { status: 200, contentType: 'image/webp', body };
}

test('home preloads one slide ahead and waits for it before advancing', async ({ page }) => {
	const requested = new Set<string>();
	let firstSource: string | undefined;
	let releaseNext: (() => void) | undefined;
	const nextAllowed = new Promise<void>((resolve) => { releaseNext = resolve; });
	await page.route(/\/_image\?/, async (route) => {
		const source = new URL(route.request().url()).searchParams.get('href') ?? '';
		firstSource ??= source;
		requested.add(source);
		if (source !== firstSource) await nextAllowed;
		await route.fulfill(await imageResponse(route.request().url(), source === firstSource ? '#222' : '#884422'));
	});
	await page.clock.install();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await page.clock.runFor(1_300);
	await expect(page.locator('[data-loading-screen]')).toBeHidden();
	await expect.poll(() => requested.size).toBe(2);
	await expect(page.locator('[data-hero-carousel] img[src]')).toHaveCount(2);
	const tint = () => page.evaluate(() => document.documentElement.style.getPropertyValue('--homepage-tint'));
	await expect.poll(tint).toBe('#223344');
	await page.clock.runFor(8_000);
	const slides = page.locator('[data-hero-carousel] .slide');
	await expect(slides.first()).toHaveClass(/is-current/);
	releaseNext!();
	await expect(slides.nth(1)).toHaveClass(/is-entering/);
	await expect.poll(tint).toBe('#884422');
	await expect(page.locator('html')).toHaveCSS('transition-duration', '1.6s');
	await expect.poll(() => requested.size).toBe(3);
	await page.clock.runFor(1_600);
	await expect(slides.nth(1)).toHaveClass(/is-current/);
});

test('home keeps the loading screen and browser tint ivory until the first image is revealed', async ({ page }) => {
	let releaseImage: (() => void) | undefined;
	const imageAllowed = new Promise<void>((resolve) => { releaseImage = resolve; });
	await page.route(/\/_image\?/, async (route) => {
		await imageAllowed;
		await route.fulfill(await imageResponse(route.request().url()));
	});
	await page.clock.install();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await page.clock.runFor(2_000);
	const loading = page.locator('[data-loading-screen]');
	await expect(loading).toBeVisible();
	await expect(loading).toHaveCSS('background-color', 'rgb(245, 241, 232)');
	await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(245, 241, 232)');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f1e8');
	releaseImage!();
	await expect(loading).toHaveClass(/is-hidden/);
	await expect(loading).toBeHidden();
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#223344');
	const revealedBackgrounds = await page.evaluate(() => [document.documentElement, document.body].map((element) => ({
		color: getComputedStyle(element).backgroundColor,
		transition: getComputedStyle(element).transitionDuration,
	})));
	expect(revealedBackgrounds).toEqual([
		{ color: 'rgb(34, 51, 68)', transition: '0s' },
		{ color: 'rgb(34, 51, 68)', transition: '0s' },
	]);
});

test('home keeps a shown loading screen for its minimum time', async ({ page }) => {
	let releaseImage: (() => void) | undefined;
	const imageAllowed = new Promise<void>((resolve) => { releaseImage = resolve; });
	await page.route(/\/_image\?/, async (route) => {
		await imageAllowed;
		await route.fulfill(await imageResponse(route.request().url()));
	});
	await page.clock.install();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const loading = page.locator('[data-loading-screen]');
	await page.clock.runFor(100);
	await expect(loading).toBeVisible();
	releaseImage!();
	await expect.poll(() => page.locator('[data-hero-carousel] .slide.is-current img').evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
	await page.clock.runFor(1_000);
	await expect(loading).toBeVisible();
	await page.clock.runFor(300);
	await expect(loading).toBeHidden();
});

test('home skips the loading screen when the first image is already ready', async ({ page }) => {
	const readyImage = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%221%22%20height=%221%22/%3E';
	await page.route('**/', async (route) => {
		const response = await route.fetch();
		const html = await response.text();
		const firstImage = html.match(/<img\b[^>]*fetchpriority="high"[^>]*>/)?.[0];
		expect(firstImage).toBeTruthy();
		const body = html.replace(firstImage!, firstImage!.replace(/\bsrc="[^"]*"/, `src="${readyImage}"`).replace(/\bsrcset="[^"]*"/, ''));
		await route.fulfill({ response, body });
	});
	await page.goto('/', { waitUntil: 'load' });
	await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
	const loading = page.locator('[data-loading-screen]');
	await expect(loading).toBeHidden();
	await expect(loading).not.toHaveAttribute('data-started-at');
});

test('reduced motion keeps only the first home image active', async ({ page }) => {
	const requested = new Set<string>();
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.route(/\/_image\?/, async (route) => {
		requested.add(new URL(route.request().url()).searchParams.get('href') ?? '');
		await route.fulfill(await imageResponse(route.request().url()));
	});
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('[data-hero-carousel] img[src]')).toHaveCount(1);
	await expect.poll(() => requested.size).toBe(1);
	await expect(page.locator('[data-loading-screen]')).toHaveClass(/is-hidden/);
});

test('artwork cards use responsive image URLs', async ({ page }) => {
	await page.goto('/artworks', { waitUntil: 'domcontentloaded' });
	const image = page.locator('[data-artwork-card] img').first();
	await expect(image).toHaveAttribute('srcset', /\/_image\?.* 480w, .* 960w/);
	await expect(image).toHaveAttribute('sizes', /20vw/);
});

test('home offers width-only images through 6K and accounts for cover cropping', async ({ page }) => {
	await page.route(/\/_image\?/, async (route) => route.fulfill(await imageResponse(route.request().url())));
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const image = page.locator('[data-hero-carousel] .slide').first().locator('img');
	await expect(image).toHaveAttribute('sizes', 'max(100vw, 160vh)');
	const candidates = (await image.getAttribute('srcset'))!.split(', ').map((candidate) => {
		const [url, descriptor] = candidate.split(' ');
		const params = new URL(url, 'https://eonmun.com').searchParams;
		expect(params.has('h')).toBe(false);
		expect(params.get('w')).toBe(descriptor.slice(0, -1));
		return Number(params.get('w'));
	});
	expect(candidates).toEqual([480, 960, 1600, 2560, 3840, 5120, 6144]);
});

test('artwork and post cards prefetch the exact detail image for visible cards', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	for (const listing of ['/artworks', '/posts']) {
		const prefetched = new Set<string>();
		await page.route(/\/_image\?/, async (route) => {
			const url = route.request().url();
			if (['1280', '2560'].includes(new URL(url).searchParams.get('h') ?? '')) prefetched.add(url);
			await route.fulfill(await imageResponse(url));
		});
		await page.goto(listing, { waitUntil: 'load' });
		const cards = page.locator('a[data-detail-image-src]');
		await expect(cards.first()).toHaveAttribute('data-astro-prefetch', 'viewport');
		await cards.first().scrollIntoViewIfNeeded();
		await expect.poll(() => prefetched.size).toBeGreaterThan(0);
		await cards.last().scrollIntoViewIfNeeded();
		await page.waitForTimeout(300);
		expect(prefetched.size).toBeLessThanOrEqual(2);
		const prefetchedUrls = [...prefetched];
		await page.goto((await cards.first().getAttribute('href'))!, { waitUntil: 'load' });
		const detailImageUrl = await page.locator('img[fetchpriority="high"]').first()
			.evaluate((image) => (image as HTMLImageElement).currentSrc);
		expect(prefetchedUrls).toContain(detailImageUrl);
		await page.unrouteAll();
	}
});

 test('homepage starts ivory and embeds saved slide colors before images or scripts run', async ({ browser }) => {
 const context = await browser.newContext({ javaScriptEnabled: false });
 const page = await context.newPage();
 await page.route(/\/_image\?/, route => route.abort());
 await page.goto('/', { waitUntil: 'domcontentloaded' });
 await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f5f1e8');
 await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(245, 241, 232)');
 await expect(page.locator('[data-hero-carousel] .slide').first()).toHaveAttribute('data-tint', '#223344');
 await context.close();
});
