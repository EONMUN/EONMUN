import { test, expect } from '@playwright/test';

test.describe('Admin Artwork Management', () => {
  // Login as admin before all tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');

    // Assuming Credentials provider is available and selected by default
    // If not, you might need to click a button like page.click('text=Sign in with Password')

    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]'); // Or specific button text
    
    // Verify successful login by checking for redirect to admin page
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test('should allow an admin to create a new artwork', async ({ page }) => {
    const artworkTitle = `Test Artwork ${Date.now()}`; // Unique title
    const artworkArtist = 'Playwright Test Artist';
    const artworkYear = '2025';
    const artworkPrice = '456.78';

    await page.goto('/admin/artworks');

    // Click on "+ New Artwork" button
    await page.click('text=+ New Artwork');
    await page.waitForURL('/admin/artworks/new');

    // Fill the form
    await page.fill('#title', artworkTitle);
    await page.fill('#artist', artworkArtist);
    await page.fill('#year', artworkYear);
    await page.fill('#price', artworkPrice);

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Artwork")');

    // Verify redirect back to admin artworks list
    await page.waitForURL('/admin/artworks');
    await expect(page).toHaveURL(/.*\/admin\/artworks/);

    // Verify the new artwork appears in the list
    await expect(page.locator(`text=${artworkTitle}`)).toBeVisible();
    await expect(page.locator(`text=${artworkArtist}`)).toBeVisible();
    await expect(page.locator(`text=$${parseFloat(artworkPrice).toFixed(2)}`)).toBeVisible();
  });

  // You might want to add tests for:
  // - Editing an artwork
  // - Deleting an artwork
  // - Form validation (e.g., required fields)
  // - Image upload (more complex)
});
