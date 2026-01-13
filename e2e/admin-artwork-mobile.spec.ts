import { test, expect, devices } from "@playwright/test";

test.describe("Admin Artwork Management - Mobile", () => {
  // Use iPhone 13 viewport for mobile testing
  test.use({ ...devices["iPhone 13"] });

  // Login as admin before all tests
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");

    await page.fill('input[name="password"]', "admin");
    await page.click('button[type="submit"]');

    // Verify successful login by checking for redirect to admin page
    await page.waitForURL("/admin", { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test("should display card layout on mobile viewport", async ({ page }) => {
    await page.goto("/admin/artworks");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Mobile card layout should be visible
    // The mobile layout uses md:hidden class, so it should be visible on mobile
    const mobileLayout = page.locator(".md\\:hidden.space-y-4");
    await expect(mobileLayout).toBeVisible();

    // Desktop table layout should be hidden on mobile
    // The desktop layout uses hidden md:block classes
    const desktopTable = page.locator(".hidden.md\\:block table");
    await expect(desktopTable).not.toBeVisible();
  });

  test("should navigate to artwork edit page from mobile card", async ({
    page,
  }) => {
    await page.goto("/admin/artworks");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Find the first artwork card and click it
    const firstCard = page
      .locator(".md\\:hidden.space-y-4 a")
      .first();

    // Check if any artworks exist
    const cardCount = await firstCard.count();
    if (cardCount > 0) {
      await firstCard.click();

      // Should navigate to edit page
      await expect(page).toHaveURL(/.*\/admin\/artworks\/edit\/.*/);
    }
  });

  test("should display new artwork button correctly on mobile", async ({
    page,
  }) => {
    await page.goto("/admin/artworks");

    // The "+ New Artwork" button should be visible and properly sized
    const newButton = page.locator('a[href="/admin/artworks/new"]').first();
    await expect(newButton).toBeVisible();
    await expect(newButton).toContainText("New Artwork");
  });

  test("should have responsive navigation on mobile", async ({ page }) => {
    await page.goto("/admin/artworks");

    // Check that navigation items are visible and properly sized
    const artworksLink = page.locator('a[href="/admin/artworks"]').first();
    const collectionsLink = page.locator('a[href="/admin/collections"]').first();

    await expect(artworksLink).toBeVisible();
    await expect(collectionsLink).toBeVisible();

    // Back to Site link should show shortened version on mobile
    const backLink = page.locator('a[href="/"]');
    await expect(backLink).toBeVisible();
  });

  test("should properly display artwork details in mobile card", async ({
    page,
  }) => {
    await page.goto("/admin/artworks");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if the first card has the expected structure
    const firstCard = page.locator(".md\\:hidden.space-y-4 a").first();

    const cardCount = await firstCard.count();
    if (cardCount > 0) {
      // Card should contain image (or placeholder), title, and other details
      const cardContent = firstCard;

      // Check for image or placeholder
      const hasImage =
        (await cardContent.locator("img").count()) > 0 ||
        (await cardContent.locator("svg").count()) > 0;
      expect(hasImage).toBeTruthy();

      // Check for title (should be visible in the card)
      const title = cardContent.locator("h3");
      await expect(title).toBeVisible();
    }
  });
});
