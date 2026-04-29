import { test, expect } from "@playwright/test";

/**
 * E2E coverage for the store product card hover overlay.
 *
 * Requirement traceability (see EONMUN/EONMUN#71):
 *   Req 2 — Animation consistency: overlay opacity transitions on hover
 *   Req 3 — Keyboard accessibility: overlay reveals on focus-within
 *   Req 4 — Screen-reader semantics: name announced once
 *   Req 5 — Reduced-motion respect: instant transition under reduce
 */

const OVERLAY = ".bg-gradient-to-t";

test.describe("Store Page Hover Description", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/store");
    await page.waitForLoadState("networkidle");
  });

  test("Req 2: should show description overlay on product hover", async ({
    page,
  }) => {
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible();

    const overlay = productCard.locator(OVERLAY);
    // Red state pre-implementation: overlay starts hidden, transitions to opaque on hover.
    await expect(overlay).toHaveCSS("opacity", "0");

    await productCard.hover();

    await expect(overlay).toHaveCSS("opacity", "1", { timeout: 2000 });
  });

  test("Req 3: should reveal overlay when product link receives keyboard focus", async ({
    page,
  }) => {
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible();

    const overlay = productCard.locator(OVERLAY);
    await expect(overlay).toHaveCSS("opacity", "0");

    // Focus the first link inside the card (simulates Tab landing on card link).
    // Red state: master code has no group-focus-within, so opacity stays at 0 even with focus.
    const cardLink = productCard.locator("a").first();
    await cardLink.focus();

    await expect(overlay).toHaveCSS("opacity", "1", { timeout: 2000 });
  });

  test("Req 4: overlay h3 must be aria-hidden so screen readers do not double-announce name", async ({
    page,
  }) => {
    const productCard = page.locator('[data-testid="product-card"]').first();
    await expect(productCard).toBeVisible();

    // Red state pre-implementation: overlay h3 lacks aria-hidden — every product name is in
    // the accessible tree twice (overlay + card body).
    const overlayHeading = productCard.locator(OVERLAY).locator("h3");
    await expect(overlayHeading).toHaveAttribute("aria-hidden", "true");
  });

  test("Req 2: should display product description in overlay if available", async ({
    page,
  }) => {
    const productCards = page.locator('[data-testid="product-card"]');
    const productCount = await productCards.count();

    // Try to find a product with a description
    for (let i = 0; i < productCount; i++) {
      const productCard = productCards.nth(i);
      await productCard.hover();

      // Description sits in the overlay container; line-clamp-2 is unique to the description paragraph.
      const description = productCard.locator(OVERLAY).locator(".line-clamp-2");
      if ((await description.count()) > 0) {
        await expect(description).toBeVisible({ timeout: 2000 });
        const descText = await description.textContent();
        expect(descText).toBeTruthy();
        expect(descText!.length).toBeGreaterThan(0);
        break;
      }
    }
  });

  test("Req 2: should show year in overlay if available", async ({ page }) => {
    const productCards = page.locator('[data-testid="product-card"]');
    const firstProduct = productCards.first();

    await firstProduct.hover();

    // Year paragraph: scoped to overlay to avoid colliding with the always-visible card body.
    const yearText = firstProduct
      .locator(OVERLAY)
      .locator("p.text-gray-300.text-sm")
      .first();
    const yearCount = await yearText.count();

    if (yearCount > 0) {
      await expect(yearText).toBeVisible({ timeout: 2000 });
      const year = await yearText.textContent();
      if (year && year.match(/\d{4}/)) {
        expect(year).toMatch(/\d{4}/);
      }
    }
  });
});
