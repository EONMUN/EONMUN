import { expect, test } from '@playwright/test';
import sharp from 'sharp';

async function imageResponse(url: string) {
	const params = new URL(url).searchParams;
	const width = Number(params.get('w') ?? 1920);
	const height = Number(params.get('h') ?? 1200);
	// Chromium needs the mock's dimensions to match the srcset candidate.
	const body = await sharp({ create: { width, height, channels: 3, background: '#222' } }).webp().toBuffer();
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
		await route.fulfill(await imageResponse(route.request().url()));
	});
	await page.clock.install();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const loading = page.locator('[data-loading-screen]');
	await expect(loading).toBeVisible();
	await page.clock.runFor(1_000);
	await expect(loading).not.toHaveClass(/is-hidden/);
	await page.clock.runFor(300);
	await expect(loading).toHaveClass(/is-hidden/);
	await expect.poll(() => requested.size).toBe(2);
	await expect(page.locator('[data-hero-carousel] img[src]')).toHaveCount(2);
	await page.clock.runFor(8_000);
	const slides = page.locator('[data-hero-carousel] .slide');
	await expect(slides.first()).toHaveClass(/is-current/);
	releaseNext!();
	await expect(slides.nth(1)).toHaveClass(/is-entering/);
	await expect.poll(() => requested.size).toBe(3);
	await page.clock.runFor(1_600);
	await expect(slides.nth(1)).toHaveClass(/is-current/);
});

test('home keeps the loading screen until the first image is ready', async ({ page }) => {
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
	releaseImage!();
	await expect(loading).toHaveClass(/is-hidden/);
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
