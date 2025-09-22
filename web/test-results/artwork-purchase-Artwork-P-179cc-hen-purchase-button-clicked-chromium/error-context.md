# Test info

- Name: Artwork Purchase Flow >> should redirect to Stripe checkout when purchase button clicked
- Location: /home/ncrmro/code/1e1104k4/eonmun/web/e2e/artwork-purchase.spec.ts:44:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/ncrmro/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Artwork Purchase Flow', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     // Navigate to the artworks page before each test
   6 |     await page.goto('/artworks');
   7 |   });
   8 |
   9 |   test('should display artwork gallery with purchase options', async ({ page }) => {
   10 |     // Verify the artwork gallery loads
   11 |     await expect(page.locator('h1')).toContainText('Artworks');
   12 |     
   13 |     // Verify artworks are displayed with prices
   14 |     const artworkLinks = page.locator('a').filter({ hasText: '$1,000' });
   15 |     await expect(artworkLinks.first()).toBeVisible();
   16 |   });
   17 |
   18 |   test('should navigate to artwork detail page', async ({ page }) => {
   19 |     // Click on the first artwork
   20 |     await page.locator('a').filter({ hasText: 'Limones del Cobre' }).first().click();
   21 |     
   22 |     // Verify we're on the artwork detail page
   23 |     await expect(page).toHaveURL(/.*\/artworks\/limones-del-cobre/);
   24 |     await expect(page.locator('h1')).toContainText('Limones del Cobre');
   25 |     
   26 |     // Verify purchase button is present
   27 |     await expect(page.locator('button', { hasText: 'Purchase Artwork' })).toBeVisible();
   28 |     
   29 |     // Verify price is displayed
   30 |     await expect(page.locator('text=$1,000')).toBeVisible();
   31 |   });
   32 |
   33 |   test('should show purchase button and pricing details', async ({ page }) => {
   34 |     // Navigate to specific artwork
   35 |     await page.goto('/artworks/limones-del-cobre');
   36 |     
   37 |     // Verify purchase section elements
   38 |     await expect(page.locator('text=$1,000')).toBeVisible();
   39 |     await expect(page.locator('text=Digital artwork with certificate of authenticity')).toBeVisible();
   40 |     await expect(page.locator('button', { hasText: 'Purchase Artwork' })).toBeVisible();
   41 |     await expect(page.locator('text=Secure payment powered by Stripe')).toBeVisible();
   42 |   });
   43 |
>  44 |   test('should redirect to Stripe checkout when purchase button clicked', async ({ page }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at /home/ncrmro/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
   45 |     // Navigate to artwork detail page
   46 |     await page.goto('/artworks/limones-del-cobre');
   47 |     
   48 |     // Click purchase button
   49 |     await page.locator('button', { hasText: 'Purchase Artwork' }).click();
   50 |     
   51 |     // Wait for redirect to Stripe Checkout
   52 |     await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 10000 });
   53 |     
   54 |     // Verify we're on Stripe's checkout page
   55 |     await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/);
   56 |     
   57 |     // Verify the artwork details are shown on Stripe page
   58 |     await expect(page.locator('text=Limones del Cobre')).toBeVisible();
   59 |     await expect(page.locator('text=$1,000.00')).toBeVisible();
   60 |   });
   61 |
   62 |   test.skip('should complete full purchase flow (requires Stripe configuration)', async ({ page }) => {
   63 |     // This test would run when Stripe environment variables are properly configured
   64 |     
   65 |     // Navigate to artwork detail page
   66 |     await page.goto('/artworks/limones-del-cobre');
   67 |     
   68 |     // Click purchase button
   69 |     await page.locator('button', { hasText: 'Purchase Artwork' }).click();
   70 |     
   71 |     // Wait for redirect to Stripe Checkout
   72 |     await page.waitForURL(/.*checkout\.stripe\.com.*/);
   73 |     
   74 |     // Fill in test card information
   75 |     await page.fill('[data-testid="cardNumber"]', '4242424242424242');
   76 |     await page.fill('[data-testid="cardExpiry"]', '12/34');
   77 |     await page.fill('[data-testid="cardCvc"]', '123');
   78 |     await page.fill('[data-testid="billingName"]', 'Test User');
   79 |     
   80 |     // Submit payment
   81 |     await page.click('[data-testid="submitButton"]');
   82 |     
   83 |     // Wait for redirect back to success page
   84 |     await page.waitForURL(/.*\/purchase\/success/);
   85 |     
   86 |     // Verify success page content
   87 |     await expect(page.locator('h1')).toContainText('Purchase Successful!');
   88 |     await expect(page.locator('text=Limones del Cobre')).toBeVisible();
   89 |     await expect(page.locator('text=$1,000.00')).toBeVisible();
   90 |   });
   91 | });
   92 |
   93 | test.describe('Purchase Flow Error Handling', () => {
   94 |   test('should successfully handle Stripe integration', async ({ page }) => {
   95 |     // Navigate to artwork page
   96 |     await page.goto('/artworks/limones-del-cobre');
   97 |     
   98 |     // Verify purchase button is present and clickable
   99 |     const purchaseButton = page.locator('button', { hasText: 'Purchase Artwork' });
  100 |     await expect(purchaseButton).toBeVisible();
  101 |     await expect(purchaseButton).toBeEnabled();
  102 |     
  103 |     // Click purchase button
  104 |     await purchaseButton.click();
  105 |     
  106 |     // Verify successful redirect to Stripe (no errors)
  107 |     await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 10000 });
  108 |     
  109 |     // Verify Stripe checkout page loads correctly
  110 |     await expect(page.locator('text=Limones del Cobre')).toBeVisible();
  111 |   });
  112 | });
```