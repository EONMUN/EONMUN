import { expect, test } from "@playwright/test";
import { adminCookies } from "../test/helpers/auth";

test("facet vocabulary can be searched, renamed, merged and deleted", async ({
	page,
	context,
}, testInfo) => {
	await context.addCookies(
		await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`),
	);
	await page.goto("/admin/facets");
	const create = page.locator("#create-facet");
	const first = `Facet source ${Date.now()}`;
	const second = `${first} destination`;
	for (const value of [first, second]) {
		await create.getByLabel("Category").selectOption("material");
		await create.getByLabel("Value", { exact: true }).fill(value);
		await create.getByRole("button", { name: "Add value" }).click();
		await expect(
			page.getByRole("heading", { name: value, exact: true }),
		).toBeVisible();
	}
	await page.getByLabel("Search", { exact: true }).fill(first);
	const source = page
		.locator(".facet-card")
		.filter({ has: page.getByRole("heading", { name: first, exact: true }) });
	await source.getByRole("button", { name: "Rename", exact: true }).click();
	const dialog = page.locator("#facet-dialog");
	const renamed = `${first} renamed`;
	await dialog.getByLabel("Value", { exact: true }).fill(renamed);
	await dialog.getByRole("button", { name: "Save name" }).click();
	await expect(
		page.getByRole("heading", { name: renamed, exact: true }),
	).toBeVisible();
	const updated = page
		.locator(".facet-card")
		.filter({ has: page.getByRole("heading", { name: renamed, exact: true }) });
	await updated.getByRole("button", { name: "Merge", exact: true }).click();
	await dialog
		.getByLabel("Destination")
		.selectOption({ label: `${second} (0 artwork)` });
	await page.screenshot({ path: testInfo.outputPath("facets-dialog.png") });
	await dialog.getByRole("button", { name: "Confirm merge" }).click();
	await expect(
		page.getByRole("heading", { name: renamed, exact: true }),
	).toHaveCount(0);
	const target = page
		.locator(".facet-card")
		.filter({ has: page.getByRole("heading", { name: second, exact: true }) });
	await target.getByRole("button", { name: "Delete unused" }).click();
	await expect(dialog).toContainText("0 artwork");
	await dialog.getByRole("button", { name: "Confirm deletion" }).click();
	await expect(
		page.getByRole("heading", { name: second, exact: true }),
	).toHaveCount(0);
	await page.setViewportSize({ width: 375, height: 812 });
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	await page.screenshot({ path: testInfo.outputPath("facets-mobile.png") });
});

test("facet mutation requires same-origin admin authorization", async ({
	request,
}) => {
	const origin = `http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`;
	const payload = { action: "create", key: "material", value: "Unauthorized" };
	const anonymous = await request.post("/api/admin/facets", {
		headers: { origin },
		data: payload,
	});
	expect(anonymous.status()).toBe(401);
	expect(anonymous.headers()["cache-control"]).toBe("no-store");
	const crossOrigin = await request.post("/api/admin/facets", {
		headers: { origin: "https://other.example" },
		data: payload,
	});
	expect(crossOrigin.status()).toBe(403);
});
