import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

test.beforeEach(async ({ context }) => {
	await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
});

test('search preserves membership and removing the cover clears its selection', async ({ page }) => {
	await page.goto('/admin/collections/botanica');
	const rows = page.locator('[data-member]');
	const selectedId = await rows.locator('[name="artworkIds"]:checked').first().getAttribute('value');
	const row = rows.filter({ has: page.locator(`[name="artworkIds"][value="${selectedId}"]`) });
	const member = row.locator('[name="artworkIds"]');
	const cover = row.locator('[name="defaultArtworkId"]');
	await cover.check();
	await page.getByLabel('Search artwork').fill('no artwork with this title');
	await expect(page.getByText('No artwork matches your search.')).toBeVisible();
	await expect(member).toBeChecked();
	await page.getByLabel('Search artwork').fill('');
	await member.uncheck();
	await expect(cover).toBeDisabled();
	await expect(cover).not.toBeChecked();
	await expect(page.getByLabel('No cover', { exact: true })).toBeChecked();
	await expect(page.locator('[data-collection-dirty]')).toHaveText('Unsaved changes');
});

test('search alone does not mark the collection dirty', async ({ page }) => {
	await page.goto('/admin/collections/botanica');
	const title = await page.locator('[data-member] .membership-label span').first().innerText();
	await page.getByLabel('Search artwork').fill(title);
	await page.getByLabel('Name', { exact: true }).focus();
	await expect(page.locator('[data-collection-dirty]')).toBeEmpty();
	await expect(page.locator('[data-member]:visible')).toHaveCount(1);
});

test('failed saves preserve edits and membership restrictions before a successful draft save', async ({ page }) => {
	await page.goto('/admin/collections/new');
	await page.getByLabel('Name', { exact: true }).fill('Editor draft');
	await page.getByLabel('Slug', { exact: true }).fill('editor-draft');
	const rows = page.locator('[data-member]');
	await rows.first().locator('[name="artworkIds"]').check();
	await rows.first().locator('[name="defaultArtworkId"]').check();
	let finish: (() => void) | undefined;
	const released = new Promise<void>(resolve => { finish = resolve; });
	let payload: Record<string, unknown> = {};
	await page.route('**/api/admin/collections', async route => {
		payload = route.request().postDataJSON();
		await released;
		await route.fulfill({ status: 500, json: { error: 'Try saving again' } });
	});
	const save = page.getByRole('button', { name: 'Save draft', exact: true });
	await save.click();
	await expect(page.locator('[data-collection-save]')).toHaveText('Saving…');
	await expect(save).toHaveAttribute('aria-disabled', 'true');
	await expect(page.getByLabel('Name', { exact: true })).toBeDisabled();
	finish!();
	await expect(page.getByText('Try saving again', { exact: true })).toBeVisible();
	await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Editor draft');
	await expect(rows.first().locator('[name="defaultArtworkId"]')).toBeChecked();
	await expect(rows.nth(1).locator('[name="defaultArtworkId"]')).toBeDisabled();
	await expect(page.locator('[data-collection-dirty]')).toHaveText('Unsaved changes');
	expect(payload.published).toBe(false);
	expect(payload.artworkIds).toEqual([Number(await rows.first().locator('[name="artworkIds"]').getAttribute('value'))]);
	expect(payload.defaultArtworkId).toBe((payload.artworkIds as number[])[0]);
	await page.unroute('**/api/admin/collections');
	await page.route('**/api/admin/collections', route => route.fulfill({ json: { redirect: '/admin/collections' } }));
	let warned = false;
	page.on('dialog', async dialog => { warned = true; await dialog.dismiss(); });
	await save.click();
	await expect(page).toHaveURL('/admin/collections');
	expect(warned).toBe(false);
});

for (const viewport of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 375, height: 812 }]) {
	test(`collection editor fits ${viewport.name}`, async ({ page }, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto('/admin/collections/botanica');
		await expect(page.getByRole('button', { name: 'Save collection', exact: true })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		await page.screenshot({ path: testInfo.outputPath(`collection-${viewport.name}.png`), fullPage: true });
	});
}
