import { expect, test } from '@playwright/test';
import sharp from 'sharp';

const images = new Map<string, Promise<Buffer>>();
async function imageResponse(url: string) {
	const params = new URL(url).searchParams;
	const width = Number(params.get('w') ?? 1920);
	const height = Number(params.get('h') ?? 1200);
	const key = `${width}x${height}`;
	if (!images.has(key)) images.set(key, sharp({ create: { width, height, channels: 3, background: '#222' } }).webp().toBuffer());
	return { status: 200, contentType: 'image/webp', body: await images.get(key)! };
}

test('home loads one slide and preloads only its successor', async ({ page }) => {
	const requested: string[] = [];
	await page.route(/\/_image\?/, async (route) => {
		requested.push(new URL(route.request().url()).searchParams.get('href') ?? '');
		await route.fulfill(await imageResponse(route.request().url()));
	});
	await page.clock.install();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const slides = page.locator('[data-hero-carousel] .slide');
	await expect(slides.first()).toHaveClass(/is-current/);
	await expect.poll(() => new Set(requested).size).toBe(2);
	expect(new Set(requested).size).toBe(2);
	await page.clock.runFor(8_000);
	await expect(slides.nth(1)).toHaveClass(/is-entering/);
	await expect.poll(() => new Set(requested).size).toBe(3);
	await page.clock.runFor(1_600);
	await expect(slides.nth(1)).toHaveClass(/is-current/);
});

test('home holds the current slide until the next image loads', async ({ page }) => {
	let firstSource: string | undefined;
	let nextRequested = false;
	let releaseNext: (() => void) | undefined;
	const nextAllowed = new Promise<void>((resolve) => { releaseNext = resolve; });
	await page.route(/\/_image\?/, async (route) => {
		const source = new URL(route.request().url()).searchParams.get('href') ?? '';
		firstSource ??= source;
		if (source !== firstSource) { nextRequested = true; await nextAllowed; }
		await route.fulfill(await imageResponse(route.request().url()));
	});
	await page.clock.install();
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect.poll(() => nextRequested).toBe(true);
	await page.clock.runFor(8_000);
	const slides = page.locator('[data-hero-carousel] .slide');
	await expect(slides.first()).toHaveClass(/is-current/);
	await expect(slides.nth(1)).not.toHaveClass(/is-entering/);
	releaseNext!();
	await expect(slides.nth(1)).toHaveClass(/is-entering/);
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
});

test('artwork cards use responsive image URLs', async ({ page }) => {
	await page.goto('/artworks', { waitUntil: 'domcontentloaded' });
	const image = page.locator('[data-artwork-card] img').first();
	await expect(image).toHaveAttribute('srcset', /\/_image\?.* 480w, .* 960w/);
	await expect(image).toHaveAttribute('sizes', /20vw/);
});
