import { expect, test } from '@playwright/test';

test('homepage logo privately opens admin sign-in after five quick taps', async ({ page }) => {
	await page.route(/\/_image\?/, (route) => route.fulfill({
		contentType: 'image/svg+xml',
		body: '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200"><rect width="100%" height="100%" fill="tan"/></svg>',
	}));
	await page.clock.install();
	await page.goto('/');
	await page.clock.runFor(2000);
	await expect(page.getByRole('navigation').getByRole('link', { name: 'Admin', exact: true })).toHaveCount(0);
	const logo = page.getByRole('link', { name: 'EONMUN', exact: true });
	await logo.click({ clickCount: 4 });
	await expect(page).toHaveURL(/\/$/);
	await page.clock.runFor(1600);
	await logo.click();
	await expect(page).toHaveURL(/\/$/);
	await logo.click({ clickCount: 4 });
	await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
	await expect(page).toHaveURL(/\/api\/auth\/signin\?callbackUrl=%2Fadmin$/);
	await logo.click();
	await expect(page).toHaveURL(/\/$/);
});
