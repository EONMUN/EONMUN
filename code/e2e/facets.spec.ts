import { expect, test } from "@playwright/test";
import { adminCookies } from "../test/helpers/auth";

test("facet table links to editing and reviews a multi-source merge without changing data on GET", async ({
	page,
	context,
}, testInfo) => {
	await context.addCookies(
		await adminCookies(`http://127.0.0.1:${process.env.EONMUN_E2E_PORT}`),
	);
	await page.goto("/admin/facets");
	const names = ["Retained", "First source", "Second source"].map(
		(name) => `${name} ${Date.now()}`,
	);
	for (const name of names) {
		await page
			.locator(".add")
			.evaluate((element: HTMLDetailsElement) => (element.open = true));
		const form = page.locator("#create-facet");
		await form.getByLabel("Category").selectOption("material");
		await form.getByLabel("Value", { exact: true }).fill(name);
		await form.getByRole("button", { name: "Add value" }).click();
		await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
	}
	await page.getByLabel("Search", { exact: true }).fill(names[0]);
	await page
		.getByRole("checkbox", { name: `Select ${names[0]}`, exact: true })
		.check();

	const categories = page.getByRole("group", { name: "Categories" });
	await page.getByLabel("Search categories", { exact: true }).fill("mater");
	await expect(
		categories.getByRole("button", { name: "Materials", exact: true }),
	).toBeVisible();
	await categories
		.getByRole("button", { name: "Materials", exact: true })
		.click();
	await expect(
		page.locator('tbody tr:visible:not([data-key="material"])'),
	).toHaveCount(0);
	await page
		.getByLabel("Search categories", { exact: true })
		.fill("orientation");
	await expect(
		categories.getByRole("button", { name: "Materials", exact: true }),
	).toBeVisible();
	await page.getByLabel("Search categories", { exact: true }).fill("");
	await expect(
		categories.getByRole("button", { name: "Materials", exact: true }),
	).toHaveAttribute("aria-pressed", "true");
	await page.getByLabel("Namespace", { exact: true }).selectOption("artwork");
	await expect(
		page.getByRole("checkbox", { name: `Select ${names[0]}`, exact: true }),
	).toBeChecked();
	await categories
		.getByRole("button", { name: "All categories", exact: true })
		.click();
	await expect(
		categories.getByRole("button", { name: "All categories", exact: true }),
	).toHaveAttribute("aria-pressed", "true");
	await expect(page.locator("tbody tr:visible")).toHaveCount(1);
	await page.getByLabel("Namespace", { exact: true }).selectOption("");
	await page.getByLabel("Search", { exact: true }).fill("");
	for (const name of names.slice(1))
		await page
			.getByRole("checkbox", { name: `Select ${name}`, exact: true })
			.check();
	await expect(page.locator("#selection-label")).toContainText(
		`Keep “${names[0]}”`,
	);
	await page.screenshot({
		path: testInfo.outputPath("facet-table-desktop.png"),
	});
	const href = await page
		.getByRole("link", { name: "Review merge" })
		.getAttribute("href");
	expect(
		new URL(href!, "http://local").searchParams.getAll("merge"),
	).toHaveLength(2);
	await page.getByRole("link", { name: "Review merge" }).click();
	await expect(
		page.getByRole("heading", { name: "Review merge" }),
	).toBeVisible();
	await page.screenshot({
		path: testInfo.outputPath("facet-review-desktop.png"),
	});
	await page.goto("/admin/facets");
	for (const name of names)
		await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
	await page.goto(href!);
	await page
		.getByRole("button", {
			name: `Confirm merge into ${names[0]}`,
			exact: true,
		})
		.click();
	await expect(page).not.toHaveURL(/merge=/);
	await page.getByLabel("Value", { exact: true }).fill(`${names[0]} renamed`);
	await page.getByRole("button", { name: "Save name", exact: true }).click();
	await expect(
		page.getByRole("heading", { name: `${names[0]} renamed`, exact: true }),
	).toBeVisible();
	await page.setViewportSize({ width: 375, height: 812 });
	await page.screenshot({ path: testInfo.outputPath("facet-edit-mobile.png") });
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	await page
		.getByRole("button", { name: "Delete unused value", exact: true })
		.click();
	await page.getByRole("button", { name: "Confirm deletion" }).click();
	await expect(page).toHaveURL("/admin/facets");
	for (const name of names)
		await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
	await page.screenshot({
		path: testInfo.outputPath("facet-table-mobile.png"),
	});
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
});

test("invalid merge query is rejected and facet mutation requires admin authorization", async ({
	page,
	request,
	context,
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
	await context.addCookies(await adminCookies(origin));
	await page.goto("/admin/facets");
	const href = await page.locator("tbody a").first().getAttribute("href");
	await page.goto(`${href}?merge=invalid`);
	await expect(page.getByRole("alert")).toContainText("Invalid merge facet ID");
	await expect(
		page.getByRole("button", { name: /Confirm merge into/ }),
	).toBeDisabled();
});
