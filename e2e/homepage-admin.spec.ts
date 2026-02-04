import { test, expect } from "@playwright/test";

test.describe("Homepage Configuration", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/auth/signin");
    await page.fill('input[name="password"]', "admin");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin");
  });

  test("should allow admin to manage homepage artworks", async ({ page }) => {
    // Navigate to homepage config
    await page.goto("/admin/homepage");
    await expect(page.locator("h1")).toContainText("Homepage Configuration");

    // Verify initial state (from fixtures)
    // We expect "Persimmons del Oro" at position 1 (index 0)
    await expect(page.locator('h3:has-text("Persimmons del Oro")')).toBeVisible();
    
    // 1. Add a new artwork
    // Select "Quiescent Citadel" from dropdown
    await page.selectOption("select", { label: "Quiescent Citadel (2025)" });
    
    // Verify it appears at the bottom
    // We had 4 items, so it should be 5th
    await expect(page.locator('h3:has-text("Quiescent Citadel")')).toBeVisible();
    
    // Target items specifically (using the move-up button as a discriminator)
    const items = page.locator('div:has(> div > button[title="Move up"])');
    await expect(items).toHaveCount(5);

    // 2. Reorder Artworks
    // Move the last item (Quiescent Citadel) UP
    const lastItemUpButton = items.last().locator('button[title="Move up"]');
    await lastItemUpButton.click();

    // 3. Save Changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator("text=Homepage artworks updated successfully")).toBeVisible();

    // 4. Verify Persistence
    await page.reload();
    await expect(page.locator('h3:has-text("Quiescent Citadel")')).toBeVisible();
    
    // 5. Remove an artwork
    // Remove the first one (Persimmons del Oro)
    const firstItemRemoveButton = items.first().locator('button[title="Remove"]');
    await firstItemRemoveButton.click();
    
    // Verify it's gone from the list
    await expect(page.locator('h3:has-text("Persimmons del Oro")')).not.toBeVisible();
    
    // Save again
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator("text=Homepage artworks updated successfully")).toBeVisible();
    
    // 6. Verify Public Homepage
    await page.goto("/");
    // Check if Quiescent Citadel is present in the carousel
    // Note: Carousel might only show active slide, so checking presence in DOM is usually enough
    await expect(page.locator("img[alt='Quiescent Citadel']")).toBeVisible();
    // Check if Persimmons is gone
    await expect(page.locator("img[alt='Persimmons del Oro']")).not.toBeVisible();
  });
});
