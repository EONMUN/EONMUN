import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Admin Artwork Management", () => {
  // Login as admin before all tests
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");

    await page.fill('input[name="password"]', "admin");
    await page.click('button[type="submit"]');

    // Verify successful login by checking for redirect to admin page
    await page.waitForURL("/admin", { timeout: 10000 });
    await expect(page).toHaveURL(/.*\/admin/);
  });

  test("should allow an admin to create a new artwork", async ({ page }) => {
    const artworkTitle = `Test Artwork ${Date.now()}`;
    const artworkArtist = "Playwright Test Artist";
    const artworkYear = "2025";
    const artworkPrice = "456.78";

    await page.goto("/admin/artworks");

    // Click on "+ New Artwork" button
    await page.click("text=+ New Artwork");
    await page.waitForURL("/admin/artworks/new");

    // Fill the form
    await page.fill("#title", artworkTitle);
    await page.fill("#artist", artworkArtist);
    await page.fill("#year", artworkYear);
    await page.fill("#price", artworkPrice);

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Artwork")');

    // Verify redirect back to admin artworks list
    await page.waitForURL("/admin/artworks");
    await expect(page).toHaveURL(/.*\/admin\/artworks/);

    // Verify the new artwork appears in the desktop table
    await expect(
      page.locator(".hidden.md\\:block table").locator(`text=${artworkTitle}`).first()
    ).toBeVisible();
  });

  test("should allow an admin to create artwork with image upload", async ({
    page,
  }) => {
    const artworkTitle = `Test Artwork With Image ${Date.now()}`;
    const artworkArtist = "Image Test Artist";
    const artworkYear = "2025";
    const artworkPrice = "999.99";

    await page.goto("/admin/artworks/new");

    // Fill the form FIRST (before image upload to avoid any race conditions)
    await page.fill("#title", artworkTitle);
    await page.fill("#artist", artworkArtist);
    await page.fill("#year", artworkYear);
    await page.fill("#price", artworkPrice);

    // Now upload image
    const testImagePath = path.join(__dirname, "fixtures/test-image.png");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete - image preview should appear
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({
      timeout: 15000,
    });

    // Wait for upload spinner to disappear (upload complete)
    await expect(page.locator("text=Uploading...")).not.toBeVisible({
      timeout: 15000,
    });

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Artwork")');

    // Verify redirect back to admin artworks list
    await page.waitForURL("/admin/artworks", { timeout: 15000 });
    await expect(page).toHaveURL(/.*\/admin\/artworks/);

    // Verify the new artwork appears in the desktop table
    await expect(
      page.locator(".hidden.md\\:block table").locator(`text=${artworkTitle}`).first()
    ).toBeVisible();
  });

  test("should reset form properly when creating multiple artworks consecutively", async ({
    page,
  }) => {
    // This test validates the bug where the edit artwork page is shown
    // instead of a fresh new artwork form after creating an artwork
    // and trying to create another one

    const testImagePath = path.join(__dirname, "fixtures/test-image.png");

    // --- Create FIRST artwork ---
    const firstArtworkTitle = `First Artwork ${Date.now()}`;
    const firstArtworkArtist = "First Artist";
    const firstArtworkYear = "2024";
    const firstArtworkPrice = "100.00";

    await page.goto("/admin/artworks/new");

    // Verify we're on the NEW artwork page (URL should be /admin/artworks/new)
    await expect(page).toHaveURL(/.*\/admin\/artworks\/new/);

    // Verify the form is empty (new artwork form)
    await expect(page.locator("#title")).toHaveValue("");
    await expect(page.locator("#artist")).toHaveValue("");

    // Verify the submit button says "Create Artwork" (not "Update Artwork")
    await expect(
      page.locator('button[type="submit"]:has-text("Create Artwork")'),
    ).toBeVisible();

    // Fill the form FIRST
    await page.fill("#title", firstArtworkTitle);
    await page.fill("#artist", firstArtworkArtist);
    await page.fill("#year", firstArtworkYear);
    await page.fill("#price", firstArtworkPrice);

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({
      timeout: 15000,
    });
    // Wait for upload to complete
    await expect(page.locator("text=Uploading...")).not.toBeVisible({
      timeout: 15000,
    });

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Artwork")');

    // Wait for redirect to artworks list
    await page.waitForURL("/admin/artworks", { timeout: 15000 });
    await expect(
      page.locator(".hidden.md\\:block table").locator(`text=${firstArtworkTitle}`).first(),
    ).toBeVisible();

    // --- Create SECOND artwork ---
    const secondArtworkTitle = `Second Artwork ${Date.now()}`;
    const secondArtworkArtist = "Second Artist";
    const secondArtworkYear = "2025";
    const secondArtworkPrice = "200.00";

    // Click "+ New Artwork" to create another artwork
    await page.click("text=+ New Artwork");
    await page.waitForURL("/admin/artworks/new");

    // CRITICAL: Verify the form is RESET and empty (not showing the first artwork's data)
    await expect(page).toHaveURL(/.*\/admin\/artworks\/new/);

    // The title field should be empty, not contain the first artwork's title
    await expect(page.locator("#title")).toHaveValue("");
    await expect(page.locator("#artist")).toHaveValue("");
    await expect(page.locator("#year")).toHaveValue("");
    await expect(page.locator("#price")).toHaveValue("");

    // The submit button should say "Create Artwork" not "Update Artwork"
    await expect(
      page.locator('button[type="submit"]:has-text("Create Artwork")'),
    ).toBeVisible();
    await expect(
      page.locator('button[type="submit"]:has-text("Update Artwork")'),
    ).not.toBeVisible();

    // There should NOT be a delete button (only present when editing)
    await expect(
      page.locator('button:has-text("Delete Artwork")'),
    ).not.toBeVisible();

    // The image preview should NOT show the first artwork's image
    // (since we're on a new form, there should be no preview)
    await expect(page.locator('img[alt="Preview"]')).not.toBeVisible();

    // Fill the second form
    await page.fill("#title", secondArtworkTitle);
    await page.fill("#artist", secondArtworkArtist);
    await page.fill("#year", secondArtworkYear);
    await page.fill("#price", secondArtworkPrice);

    // Now upload image for second artwork
    const fileInput2 = page.locator('input[type="file"]');
    await fileInput2.setInputFiles(testImagePath);
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({
      timeout: 15000,
    });
    // Wait for upload to complete
    await expect(page.locator("text=Uploading...")).not.toBeVisible({
      timeout: 15000,
    });

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Artwork")');

    // Wait for redirect to artworks list
    await page.waitForURL("/admin/artworks", { timeout: 15000 });

    // Verify both artworks appear in the desktop table
    await expect(
      page.locator(".hidden.md\\:block table").locator(`text=${firstArtworkTitle}`).first(),
    ).toBeVisible();
    await expect(
      page.locator(".hidden.md\\:block table").locator(`text=${secondArtworkTitle}`).first(),
    ).toBeVisible();
  });
});
