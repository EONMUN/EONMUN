import { test, expect } from '@playwright/test';

test.describe('Artwork Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the artworks page before each test
    await page.goto('/artworks');
  });

  test('should display artwork gallery with purchase options', async ({ page }) => {
    // Verify the artwork gallery loads
    await expect(page.locator('h1')).toContainText('Artworks');
    
    // Verify artworks are displayed with prices
    const artworkLinks = page.locator('a').filter({ hasText: '$1,400' });
    await expect(artworkLinks.first()).toBeVisible();
  });

  test('should navigate to artwork detail page', async ({ page }) => {
    // Navigate directly to artwork detail page
    await page.goto('/artworks/limones-del-cobre');
    
    // Verify we're on the artwork detail page
    await expect(page).toHaveURL(/.*\/artworks\/limones-del-cobre/);
    await expect(page.locator('h1')).toContainText('Limones del Cobre');
    
    // Verify purchase button is present
    await expect(page.locator('button', { hasText: 'Purchase Artwork' })).toBeVisible();
    
    // Verify price is displayed
    await expect(page.locator('text=$1,400')).toBeVisible();
  });

  test('should show purchase button and pricing details', async ({ page }) => {
    // Navigate to specific artwork
    await page.goto('/artworks/limones-del-cobre');
    
    // Verify purchase section elements
    await expect(page.locator('text=$1,400')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Purchase Artwork' })).toBeVisible();
    await expect(page.locator('text=Secure payment via Stripe. Includes certificate of authenticity.')).toBeVisible();
  });

  test('should redirect to Stripe checkout when purchase button clicked', async ({ page }) => {
    // Navigate to artwork detail page
    await page.goto('/artworks/limones-del-cobre');
    
    // Click purchase button
    await page.locator('button', { hasText: 'Purchase Artwork' }).click();
    
    // Wait for redirect to Stripe Checkout
    await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 10000 });
    
    // Verify we're on Stripe's checkout page
    await expect(page).toHaveURL(/.*checkout\.stripe\.com.*/);
    
    // Verify the artwork details are shown on Stripe page
    await expect(page.locator('text=Limones del Cobre')).toBeVisible();
    await expect(page.locator('text=$1,400.00')).toBeVisible();
  });

  test.skip('should complete full purchase flow (requires Stripe configuration)', async ({ page }) => {
    // This test would run when Stripe environment variables are properly configured
    
    // Navigate to artwork detail page
    await page.goto('/artworks/limones-del-cobre');
    
    // Click purchase button
    await page.locator('button', { hasText: 'Purchase Artwork' }).click();
    
    // Wait for redirect to Stripe Checkout
    await page.waitForURL(/.*checkout\.stripe\.com.*/);
    
    // Fill in test card information
    await page.fill('[data-testid="cardNumber"]', '4242424242424242');
    await page.fill('[data-testid="cardExpiry"]', '12/34');
    await page.fill('[data-testid="cardCvc"]', '123');
    await page.fill('[data-testid="billingName"]', 'Test User');
    
    // Submit payment
    await page.click('[data-testid="submitButton"]');
    
    // Wait for redirect back to success page
    await page.waitForURL(/.*\/purchase\/success/);
    
    // Verify success page content
    await expect(page.locator('h1')).toContainText('Purchase Successful!');
    await expect(page.locator('text=Limones del Cobre')).toBeVisible();
    await expect(page.locator('text=$1,400.00')).toBeVisible();
  });
});

test.describe('Purchase Flow Error Handling', () => {
  test('should successfully handle Stripe integration', async ({ page }) => {
    // Navigate to artwork page
    await page.goto('/artworks/limones-del-cobre');
    
    // Verify purchase button is present and clickable
    const purchaseButton = page.locator('button', { hasText: 'Purchase Artwork' });
    await expect(purchaseButton).toBeVisible();
    await expect(purchaseButton).toBeEnabled();
    
    // Click purchase button
    await purchaseButton.click();
    
    // Verify successful redirect to Stripe (no errors)
    await page.waitForURL(/.*checkout\.stripe\.com.*/, { timeout: 10000 });
    
    // Verify Stripe checkout page loads correctly
    await expect(page.locator('text=Limones del Cobre')).toBeVisible();
  });
});