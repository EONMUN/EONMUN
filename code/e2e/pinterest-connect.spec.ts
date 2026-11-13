import { expect, test } from '@playwright/test';
import { adminCookies } from '../test/helpers/auth';

test('Pinterest connection protects mutations and rejects unsolicited callbacks', async ({request, context}) => {
 const origin = `http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`;
 expect((await request.post('/api/admin/pinterest-connect', {headers:{origin}, data:{action:'connect'}})).status()).toBe(401);
 await context.addCookies(await adminCookies(origin));
 expect((await context.request.post('/api/admin/pinterest-connect', {headers:{origin:'https://other.example'}, data:{action:'disconnect'}})).status()).toBe(403);
 const callback = await context.request.get('/api/admin/pinterest-connect/callback?code=fake&state=fake', {maxRedirects:0});
 expect(callback.status()).toBe(303);
 expect(callback.headers().location).toContain('pinterestConnection=failed');
 expect(callback.headers()['cache-control']).toBe('no-store');
});

test('settings offers Pinterest authorization and reports connection errors without exposing tokens', async ({page, context}, testInfo) => {
 await context.addCookies(await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`));
 await page.route('**/api/admin/pinterest-connect', route => route.fulfill({status:400, json:{error:'Connect Pinterest from production admin settings.'}}));
 await page.goto('/admin/settings#pinterest');
 await page.getByRole('button', {name:'Connect Pinterest', exact:true}).click();
 await expect(page.locator('[data-board-status]')).toHaveText('Connect Pinterest from production admin settings.');
 await page.getByRole('button', {name:'Connect Pinterest', exact:true}).scrollIntoViewIfNeeded();
 await page.screenshot({path:testInfo.outputPath('pinterest-connect.png')});
});
