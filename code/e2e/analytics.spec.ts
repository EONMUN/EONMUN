import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

const script = execFileSync('bun', ['build', 'src/lib/analytics.ts', '--target=browser'], { encoding: 'utf8' });

for (const state of ['signed-in', 'signed-out', 'unavailable']) {
	test(`tracks navigation and checkout with a ${state} session`, async ({ page }) => {
		await page.route('https://analytics.test/**', async (route) => {
			if (route.request().url().endsWith('/api/auth/session')) {
				await route.fulfill({
					status: state === 'unavailable' ? 503 : 200,
					json: state === 'signed-in' ? { user: { id: 'google-123', email: 'admin@example.com', name: 'Admin' } } : {},
				});
			} else {
				await route.fulfill({ contentType: 'text/html', body: `
					<a href="/posts/studio"><span>Read post</span></a>
					<a href="/artworks/painting?collection=botanica"><span>See artwork</span></a>
					<a href="https://elsewhere.test/posts/external">External</a>
					<form data-buy-form action="/api/checkout" method="POST">
						<input name="artworkSlug" value="painting" type="hidden"><button>Buy</button>
					</form>` });
			}
		});
		await page.goto('https://analytics.test/artworks/painting?checkout=success');
		await page.addScriptTag({ type: 'module', content: `${script}
			window.calls = [];
			const client = {
				capture: (...args) => calls.push(['capture', ...args]),
				identify: (...args) => calls.push(['identify', ...args]),
				reset: () => calls.push(['reset']),
				get_property: () => 'previous-user',
			};
			await startAnalytics(client);
			window.ready = true;
			document.addEventListener('click', e => e.preventDefault());
			document.addEventListener('submit', e => { window.submitted = true; e.preventDefault(); });
		` });
		await page.waitForFunction(() => (window as any).ready);
		await page.getByText('Read post').click();
		await page.getByText('See artwork').click();
		await page.getByText('External', { exact: true }).click();
		// Keyboard submission must be tracked as well as a mouse click on Buy.
		await page.getByRole('button', { name: 'Buy' }).focus();
		await page.evaluate(() => document.querySelector('form')!.requestSubmit());
		const calls = await page.evaluate(() => (window as any).calls);
		const events = calls.filter((call: any[]) => call[0] === 'capture');
		expect(events.map((call: any[]) => call[1])).toEqual([
			'$pageview', 'checkout_returned', 'post_clicked', 'artwork_clicked', 'checkout_started',
		]);
		expect(events[1][2]).toMatchObject({ artwork_slug: 'painting', checkout_status: 'success' });
		expect(events[2][2]).toEqual({ post_slug: 'studio', source_path: '/artworks/painting', destination_path: '/posts/studio' });
		expect(events[3][2]).toMatchObject({ artwork_slug: 'painting', collection_slug: 'botanica' });
		expect(events[4][2]).toEqual({ artwork_slug: 'painting', source_path: '/artworks/painting' });
		expect(events[4][3]).toEqual({ transport: 'sendBeacon', send_instantly: true });
		expect(await page.evaluate(() => (window as any).submitted)).toBe(true);
		if (state === 'signed-in') expect(calls[0]).toEqual(['identify', 'google-123', { email: 'admin@example.com', name: 'Admin' }]);
		if (state === 'signed-out') expect(calls[0]).toEqual(['reset']);
		if (state === 'unavailable') expect(calls[0]).toEqual(['capture', '$pageview', {}]);
	});
}

for (const path of ['/collections/botanica', '/artworks/painting?collection=botanica']) {
	test(`attributes views and collection clicks from ${path}`, async ({ page }) => {
		await page.route('https://analytics.test/**', route => route.request().url().endsWith('/api/auth/session')
			? route.fulfill({ json: {} })
			: route.fulfill({ contentType: 'text/html', body: '<a href="/collections/oriental">Oriental</a>' }));
		await page.goto(`https://analytics.test${path}`);
		await page.addScriptTag({ type: 'module', content: `${script}
			window.calls = [];
			await startAnalytics({ capture: (...args) => calls.push(args), identify() {}, reset() {}, get_property() {} });
			document.addEventListener('click', e => e.preventDefault());
			window.ready = true;
		` });
		await page.waitForFunction(() => (window as any).ready);
		await page.getByRole('link', { name: 'Oriental' }).click();
		const calls = await page.evaluate(() => (window as any).calls);
		expect(calls[0]).toEqual(['$pageview', { collection_slug: 'botanica' }]);
		expect(calls[1][0]).toBe('collection_clicked');
		expect(calls[1][1]).toMatchObject({ collection_slug: 'oriental', destination_path: '/collections/oriental' });
	});
}
