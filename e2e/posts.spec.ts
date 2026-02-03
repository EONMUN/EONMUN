import { test, expect } from "@playwright/test";
import { generateSlug } from "../src/lib/utils";

test.describe("Blog Post Management", () => {
  // Login as admin before all tests
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await page.fill('input[name="password"]', "admin");
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin", { timeout: 10000 });
  });

  test("should allow an admin to create a published post and verify visibility", async ({
    page,
  }) => {
    const postTitle = `Published Test Post ${Date.now()}`;
    const postSlug = generateSlug(postTitle);
    const postBody = "## Test Content\n\nThis is a **published** post test.";

    await page.goto("/admin/posts/new");

    // Fill the form
    await page.fill("#title", postTitle);
    await page.fill("#excerpt", "A test published post excerpt");
    
    // Fill Markdown body
    await page.fill("#body", postBody);

    // Select Post Type (default is general, let's pick announcement)
    await page.selectOption("#postType", "announcement");

    // Publish Status: Published
    await page.click('input[value="published"]');

    // Submit
    await page.click('button[type="submit"]:has-text("Create Post")');
    await page.waitForURL("/admin/posts");

    // Verify presence in admin list
    await expect(page.locator('.hidden.md\\:block table').locator(`text=${postTitle}`).first()).toBeVisible();
    
    // Verify visibility on public /posts page
    await page.goto("/posts");
    await expect(page.locator(`text=${postTitle}`).first()).toBeVisible();

    // Verify detail page
    await page.click(`text=${postTitle}`);
    await page.waitForURL(`/posts/${postSlug}`);
    await expect(page.locator("h1")).toHaveText(postTitle);
    await expect(page.locator(".prose")).toContainText("Test Content");
  });

  test("should handle scheduled posts visibility correctly", async ({ page }) => {
    // --- Scenario 1: Future Scheduled Post (Should be HIDDEN) ---
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
    // Format to YYYY-MM-DDTHH:mm for datetime-local input (local time, not UTC)
    const futureDateStr = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}-${String(futureDate.getDate()).padStart(2, '0')}T${String(futureDate.getHours()).padStart(2, '0')}:${String(futureDate.getMinutes()).padStart(2, '0')}`;
    
    const futurePostTitle = `Future Scheduled Post ${Date.now()}`;
    const futurePostSlug = generateSlug(futurePostTitle);

    await page.goto("/admin/posts/new");
    await page.fill("#title", futurePostTitle);
    await page.fill("#body", "Future content");
    
    // Select Scheduled
    await page.click('input[value="scheduled"]');
    
    // Fill Date
    await page.fill('input[type="datetime-local"]', futureDateStr);
    
    await page.click('button[type="submit"]');
    await page.waitForURL("/admin/posts");
    
    // Verify in Admin List
    await expect(page.locator('.hidden.md\\:block table').locator(`text=${futurePostTitle}`).first()).toBeVisible();

    // Verify NOT on Public Page
    await page.goto("/posts");
    await expect(page.locator(`text=${futurePostTitle}`)).not.toBeVisible();

    // Verify NOT accessible directly (should 404)
    await page.goto(`/posts/${futurePostSlug}`);
    await expect(page.locator("text=404")).toBeVisible();


    // --- Scenario 2: Past Scheduled Post (Should be VISIBLE) ---
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday
    const pastDateStr = `${pastDate.getFullYear()}-${String(pastDate.getMonth() + 1).padStart(2, '0')}-${String(pastDate.getDate()).padStart(2, '0')}T${String(pastDate.getHours()).padStart(2, '0')}:${String(pastDate.getMinutes()).padStart(2, '0')}`;

    const pastPostTitle = `Past Scheduled Post ${Date.now()}`;
    const pastPostSlug = generateSlug(pastPostTitle);

    await page.goto("/admin/posts/new");
    await page.fill("#title", pastPostTitle);
    await page.fill("#body", "Past content");

    // Select Scheduled
    await page.click('input[value="scheduled"]');

    // Fill Date
    await page.fill('input[type="datetime-local"]', pastDateStr);

    await page.click('button[type="submit"]');
    await page.waitForURL("/admin/posts");

    // Verify on Public Page
    await page.goto("/posts");
    await expect(page.locator(`text=${pastPostTitle}`).first()).toBeVisible();

    // Verify accessible directly
    await page.goto(`/posts/${pastPostSlug}`);
    await expect(page.locator("h1")).toHaveText(pastPostTitle);
  });
});
