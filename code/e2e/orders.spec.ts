import { expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { adminCookies } from '../test/helpers/auth';
import { paidCheckoutEvent } from '../test/helpers/stripe-checkout';

test('a signed paid Checkout event becomes a private admin order', async ({ page, context, request }) => {
	const run = `${Date.now()}`;
	const buyer = `Ada Buyer ${run}`;
	const sessionId = `cs_test_e2e_${run}`;
	const title = `Commission ${run}`;
	// No product metadata, so the seeded inventory other specs buy stays available.
	const body = JSON.stringify(paidCheckoutEvent({
		eventId: `evt_e2e_${run}`,
		created: Math.floor(Date.now() / 1000),
		session: {
			id: sessionId,
			metadata: { artworkTitle: title },
			customer_details: { email: 'buyer@example.com', name: buyer, phone: '+15125550100', address: { line1: '1 Billing Way', city: 'Austin', state: 'TX', postal_code: '78701', country: 'US' } },
		},
	}));
	const timestamp = Math.floor(Date.now() / 1000);
	const signature = createHmac('sha256', 'whsec_playwright').update(`${timestamp}.${body}`).digest('hex');
	for (let delivery = 0; delivery < 2; delivery++) {
		const response = await request.post('/api/webhooks/stripe', { headers: { 'stripe-signature': `t=${timestamp},v1=${signature}` }, data: body });
		expect(response.status()).toBe(200);
	}

	const anonymous = await request.get('/admin/orders', { maxRedirects: 0 });
	expect(anonymous.status()).toBe(302);
	expect(anonymous.headers()['cache-control']).toBe('no-store');
	const update = await request.post('/api/admin/orders/00000000-0000-4000-8000-000000000000', { headers: { origin: `http://127.0.0.1:${process.env.EONMUN_E2E_PORT}` }, data: { fulfillmentStatus: 'shipped' } });
	expect(update.status()).toBe(401);

	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
	// Positive control: the dev-mode tracker markers are present on a public page.
	const publicHtml = await (await page.request.get('/artworks')).text();
	expect(publicHtml).toContain('Analytics.astro');
	expect(publicHtml).toContain('pintrk');
	const list = await page.goto('/admin/orders');
	expect(list?.headers()['cache-control']).toBe('no-store');
	const listHtml = await list!.text();
	expect(listHtml).toContain(buyer);
	expect(listHtml).not.toContain('Analytics.astro');
	expect(listHtml).not.toContain('pintrk');
	const row = page.getByRole('row').filter({ hasText: buyer });
	await expect(row).toHaveCount(1);
	await expect(row).toContainText('Santa Fe, NM, US');
	await expect(row).toContainText('$1,250.00');
	await expect(row).toContainText('Unmatched artwork');
	await row.getByRole('link', { name: title }).click();

	await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
	const detailHtml = await (await page.request.get(page.url())).text();
	expect(detailHtml).toContain('buyer@example.com');
	expect(detailHtml).not.toContain('Analytics.astro');
	expect(detailHtml).not.toContain('pintrk');
	await expect(page.getByText('Stripe did not identify an artwork product')).toBeVisible();
	await expect(page.locator('[data-shipping-label]')).toHaveText('Grace Recipient\n9 Gallery Rd\nSanta Fe, NM 87501\nUS\n+15125550100');
	await expect(page.getByRole('link', { name: 'buyer@example.com' })).toHaveAttribute('href', 'mailto:buyer@example.com');
	await expect(page.getByText('Austin, TX 78701')).toBeVisible();
	await expect(page.getByText(sessionId)).toBeVisible();
	await expect(page.getByRole('link', { name: 'pi_test_paid' })).toHaveAttribute('href', 'https://dashboard.stripe.com/test/payments/pi_test_paid');

	await page.getByRole('combobox', { name: 'Fulfillment status', exact: true }).selectOption('shipped');
	await page.getByRole('button', { name: 'Save status' }).click();
	await expect(page.getByText('Saved', { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByRole('combobox', { name: 'Fulfillment status', exact: true })).toHaveValue('shipped');
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(page.getByRole('button', { name: 'Save status' })).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	await page.screenshot({ path: 'test-results/admin-order-mobile.png', fullPage: true });
});
