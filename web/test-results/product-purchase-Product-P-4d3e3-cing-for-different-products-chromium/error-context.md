# Test info

- Name: Product Purchase Flow >> should display correct pricing for different products
- Location: /home/ncrmro/code/1e1104k4/eonmun/web/e2e/product-purchase.spec.ts:106:7

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
   6 |     await page.goto('/store');
   7 |     await page.waitForLoadState('networkidle');
   8 |   });
   9 |
   10 |   test('should display products on store page', async ({ page }) => {
   11 |     // Check that products are loaded
   12 |     await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
   13 |     
   14 |     // Check for different product types
   15 |     const productCards = page.locator('[data-testid="product-card"]');
   16 |     expect(await productCards.count()).toBeGreaterThan(0);
   17 |     
   18 |     // Verify product information is displayed
   19 |     const firstProduct = productCards.first();
   20 |     await expect(firstProduct.locator('h3')).toBeVisible(); // Product title
   21 |     await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible(); // Product price
   22 |   });
   23 |
   24 |   test('should navigate to product detail page', async ({ page }) => {
   25 |     // Click on the first product
   26 |     const firstProduct = page.locator('[data-testid="product-card"]').first();
   27 |     const productTitle = await firstProduct.locator('h3').textContent();
   28 |     
   29 |     await firstProduct.click();
   30 |     await page.waitForLoadState('networkidle');
   31 |     
   32 |     // Verify we're on the product detail page
   33 |     expect(page.url()).toMatch(/\/store\/[^\/]+$/);
   34 |     
   35 |     // Check that product details are displayed
   36 |     await expect(page.locator('h1')).toContainText(productTitle || '');
   37 |     await expect(page.locator('[data-testid="purchase-button"]')).toBeVisible();
   38 |   });
   39 |
   40 |   test('should handle print product purchase flow', async ({ page }) => {
   41 |     // Find and click on a print product
   42 |     const printProduct = page.locator('[data-testid="product-card"]').filter({
   43 |       hasText: 'Print'
   44 |     }).first();
   45 |     
   46 |     if (await printProduct.count() > 0) {
   47 |       await printProduct.click();
   48 |       await page.waitForLoadState('networkidle');
   49 |       
   50 |       // Click purchase button
   51 |       const purchaseButton = page.locator('[data-testid="purchase-button"]');
   52 |       await expect(purchaseButton).toBeVisible();
   53 |       await purchaseButton.click();
   54 |       
   55 |       // Should redirect to Stripe checkout
   56 |       await page.waitForTimeout(3000); // Wait for redirect
   57 |       expect(page.url()).toContain('checkout.stripe.com');
   58 |     }
   59 |   });
   60 |
   61 |   test('should handle digital product purchase flow', async ({ page }) => {
   62 |     // Find and click on a digital product
   63 |     const digitalProduct = page.locator('[data-testid="product-card"]').filter({
   64 |       hasText: 'Digital'
   65 |     }).first();
   66 |     
   67 |     if (await digitalProduct.count() > 0) {
   68 |       await digitalProduct.click();
   69 |       await page.waitForLoadState('networkidle');
   70 |       
   71 |       // Verify digital product indicators
   72 |       await expect(page.locator('text=Digital download')).toBeVisible();
   73 |       
   74 |       // Click purchase button
   75 |       const purchaseButton = page.locator('[data-testid="purchase-button"]');
   76 |       await expect(purchaseButton).toBeVisible();
   77 |       await purchaseButton.click();
   78 |       
   79 |       // Should redirect to Stripe checkout
   80 |       await page.waitForTimeout(3000); // Wait for redirect
   81 |       expect(page.url()).toContain('checkout.stripe.com');
   82 |     }
   83 |   });
   84 |
   85 |   test('should handle merchandise product purchase flow', async ({ page }) => {
   86 |     // Find and click on a merchandise product
   87 |     const merchProduct = page.locator('[data-testid="product-card"]').filter({
   88 |       hasText: 'Merchandise'
   89 |     }).first();
   90 |     
   91 |     if (await merchProduct.count() > 0) {
   92 |       await merchProduct.click();
   93 |       await page.waitForLoadState('networkidle');
   94 |       
   95 |       // Click purchase button
   96 |       const purchaseButton = page.locator('[data-testid="purchase-button"]');
   97 |       await expect(purchaseButton).toBeVisible();
   98 |       await purchaseButton.click();
   99 |       
  100 |       // Should redirect to Stripe checkout
  101 |       await page.waitForTimeout(3000); // Wait for redirect
  102 |       expect(page.url()).toContain('checkout.stripe.com');
  103 |     }
  104 |   });
  105 |
> 106 |   test('should display correct pricing for different products', async ({ page }) => {
      |       ^ Error: browserType.launch: Executable doesn't exist at /home/ncrmro/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell
  107 |     const productCards = page.locator('[data-testid="product-card"]');
  108 |     const productCount = await productCards.count();
  109 |     
  110 |     for (let i = 0; i < Math.min(productCount, 3); i++) {
  111 |       const product = productCards.nth(i);
  112 |       const priceElement = product.locator('[data-testid="product-price"]');
  113 |       
  114 |       await expect(priceElement).toBeVisible();
  115 |       
  116 |       const priceText = await priceElement.textContent();
  117 |       expect(priceText).toMatch(/\$\d+/); // Should contain dollar sign and number
  118 |     }
  119 |   });
  120 |
  121 |   test('should show product availability status', async ({ page }) => {
  122 |     const productCards = page.locator('[data-testid="product-card"]');
  123 |     const firstProduct = productCards.first();
  124 |     
  125 |     await firstProduct.click();
  126 |     await page.waitForLoadState('networkidle');
  127 |     
  128 |     // Check for availability indicators
  129 |     const purchaseButton = page.locator('[data-testid="purchase-button"]');
  130 |     await expect(purchaseButton).toBeVisible();
  131 |     await expect(purchaseButton).not.toBeDisabled();
  132 |   });
  133 |
  134 |   test('should handle product type filtering', async ({ page }) => {
  135 |     // Check if there are filter options available
  136 |     const filterOptions = page.locator('[data-testid="product-filter"]');
  137 |     
  138 |     if (await filterOptions.count() > 0) {
  139 |       // Test filtering by product type
  140 |       await filterOptions.first().click();
  141 |       await page.waitForLoadState('networkidle');
  142 |       
  143 |       // Verify filtered results
  144 |       const productCards = page.locator('[data-testid="product-card"]');
  145 |       expect(await productCards.count()).toBeGreaterThanOrEqual(0);
  146 |     }
  147 |   });
  148 | });
```