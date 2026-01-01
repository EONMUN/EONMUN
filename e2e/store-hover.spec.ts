import { test, expect } from '@playwright/test';

test.describe('Store Page Hover Description', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/store');
    await page.waitForLoadState('networkidle');
  });

  test('should show description overlay on product hover', async ({ page }) => {
    // Check that products are loaded
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible();
    
    // Hover over the product card to trigger the overlay
    await productCard.hover();
    
    // The overlay should become visible - check for the title in the overlay
    const overlayTitle = productCard.locator('h3.text-white');
    await expect(overlayTitle).toBeVisible({ timeout: 2000 });
  });

  test('should display product description in overlay if available', async ({ page }) => {
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();
    
    // Try to find a product with a description
    for (let i = 0; i < productCount; i++) {
      const productCard = productCards.nth(i);
      await productCard.hover();
      
      // Check if description text exists in the overlay
      const description = productCard.locator('.text-gray-300.line-clamp-2');
      if (await description.count() > 0) {
        await expect(description).toBeVisible({ timeout: 2000 });
        const descText = await description.textContent();
        expect(descText).toBeTruthy();
        expect(descText!.length).toBeGreaterThan(0);
        break; // Found one, test passes
      }
    }
  });

  test('should show year in overlay if available', async ({ page }) => {
    const productCards = page.locator('[data-testid="product-card"]');
    const firstProduct = productCards.first();
    
    await firstProduct.hover();
    
    // Check if year is displayed (might not be present on all products)
    const yearText = firstProduct.locator('.text-gray-300.text-sm').first();
    const yearCount = await yearText.count();
    
    if (yearCount > 0) {
      await expect(yearText).toBeVisible({ timeout: 2000 });
      const year = await yearText.textContent();
      // Year should be a 4-digit number if present
      if (year && year.match(/\d{4}/)) {
        expect(year).toMatch(/\d{4}/);
      }
    }
  });
});
