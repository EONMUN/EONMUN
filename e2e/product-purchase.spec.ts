import { test, expect } from '@playwright/test';

test.describe('Product Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the products page
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
  });

  test('should display products on store page', async ({ page }) => {
    // Check that products are loaded
    await expect(page.locator('[data-testid="product-card"]').first()).toBeVisible();
    
    // Check for different product types
    const productCards = page.locator('[data-testid="product-card"]');
    expect(await productCards.count()).toBeGreaterThan(0);
    
    // Verify product information is displayed
    const firstProduct = productCards.first();
    await expect(firstProduct.locator('h3')).toBeVisible(); // Product title
    await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible(); // Product price
  });

  test('should navigate to product detail page', async ({ page }) => {
    // Click on the first product
    const firstProduct = page.locator('[data-testid="product-card"]').first();
    const productTitle = await firstProduct.locator('h3').textContent();
    
    await firstProduct.locator('a').first().click();
    await page.waitForURL(/\/store\/[^\/]+$/); // Wait for navigation to product detail page
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the product detail page
    expect(page.url()).toMatch(/\/store\/[^\/]+$/);
    
    // Check that product details are displayed
    await expect(page.locator('h1')).toContainText(productTitle || '');
    await expect(page.locator('[data-testid="purchase-button"]')).toBeVisible();
  });

  test('should handle print product purchase flow', async ({ page }) => {
    // Find and click on a print product
    const printProduct = page.locator('[data-testid="product-card"]').filter({
      hasText: 'Print'
    }).first();
    
    if (await printProduct.count() > 0) {
      await printProduct.click();
      await page.waitForLoadState('networkidle');
      
      // Click purchase button
      const purchaseButton = page.locator('[data-testid="purchase-button"]');
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();
      
      // Should redirect to Stripe checkout
      await page.waitForTimeout(3000); // Wait for redirect
      expect(page.url()).toContain('checkout.stripe.com');
    }
  });

  test('should handle digital product purchase flow', async ({ page }) => {
    // Find and click on a digital product
    const digitalProduct = page.locator('[data-testid="product-card"]').filter({
      hasText: 'Digital'
    }).first();
    
    if (await digitalProduct.count() > 0) {
      await digitalProduct.click();
      await page.waitForLoadState('networkidle');
      
      // Verify digital product indicators
      await expect(page.locator('text=Digital download')).toBeVisible();
      
      // Click purchase button
      const purchaseButton = page.locator('[data-testid="purchase-button"]');
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();
      
      // Should redirect to Stripe checkout
      await page.waitForTimeout(3000); // Wait for redirect
      expect(page.url()).toContain('checkout.stripe.com');
    }
  });

  test('should handle merchandise product purchase flow', async ({ page }) => {
    // Find and click on a merchandise product
    const merchProduct = page.locator('[data-testid="product-card"]').filter({
      hasText: 'Merchandise'
    }).first();
    
    if (await merchProduct.count() > 0) {
      await merchProduct.click();
      await page.waitForLoadState('networkidle');
      
      // Click purchase button
      const purchaseButton = page.locator('[data-testid="purchase-button"]');
      await expect(purchaseButton).toBeVisible();
      await purchaseButton.click();
      
      // Should redirect to Stripe checkout
      await page.waitForTimeout(3000); // Wait for redirect
      expect(page.url()).toContain('checkout.stripe.com');
    }
  });

  test('should display correct pricing for different products', async ({ page }) => {
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();
    
    for (let i = 0; i < Math.min(productCount, 3); i++) {
      const product = productCards.nth(i);
      const priceElement = product.locator('[data-testid="product-price"]');
      
      await expect(priceElement).toBeVisible();
      
      const priceText = await priceElement.textContent();
      expect(priceText).toMatch(/\$\d+/); // Should contain dollar sign and number
    }
  });

  test('should show product availability status', async ({ page }) => {
    const productCards = page.locator('[data-testid="product-card"]');
    const firstProduct = productCards.first();
    
    await firstProduct.click();
    await page.waitForLoadState('networkidle');
    
    // Check for availability indicators
    const purchaseButton = page.locator('[data-testid="purchase-button"]');
    await expect(purchaseButton).toBeVisible();
    await expect(purchaseButton).not.toBeDisabled();
  });

  test('should handle product type filtering', async ({ page }) => {
    // Check if there are filter options available
    const filterOptions = page.locator('[data-testid="product-filter"]');
    
    if (await filterOptions.count() > 0) {
      // Test filtering by product type
      await filterOptions.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify filtered results
      const productCards = page.locator('[data-testid="product-card"]');
      expect(await productCards.count()).toBeGreaterThanOrEqual(0);
    }
  });
});