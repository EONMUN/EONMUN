import { test, expect } from "@playwright/test";

test.describe("About page", () => {
  test("renders headings, CTAs, and SEO metadata", async ({ page }) => {
    await page.goto("/about");

    // Hero heading is the site name (matches Navigation/site.ts conventions).
    await expect(
      page.getByRole("heading", { level: 1, name: /eonmun/i }),
    ).toBeVisible();

    // Required structural sections per M2 (bio + artist statement).
    await expect(
      page.getByRole("heading", { level: 2, name: /biography/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /artist statement/i }),
    ).toBeVisible();

    // CTAs link to collections and contact.
    await expect(
      page.getByRole("link", { name: /view collections/i }),
    ).toHaveAttribute("href", "/collections");
    await expect(
      page.getByRole("link", { name: /^contact$/i }).first(),
    ).toHaveAttribute("href", "/contact");

    // SEO: og:type=website and absolute og:url for /about.
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "website",
    );
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    expect(ogUrl).toMatch(/\/about$/);

    // twitter:card must be summary_large_image (set by buildSocialMetadata).
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });
});
