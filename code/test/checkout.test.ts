import { describe, expect, test } from "bun:test";
import { createStripeCheckoutSession, handleCheckoutRequest } from "../src/lib/checkout";
import { handleInventoryRequest } from "../src/lib/inventory";

describe("inventory", () => {
	test.each([
		["available", { artworkSlug: "work", published: true, available: true, sold: false }, 200, true, "available"],
		["unavailable", { artworkSlug: "work", published: true, available: false, sold: false }, 200, false, "unavailable"],
		["sold", { artworkSlug: "work", published: true, available: false, sold: true }, 200, false, "sold"],
		["draft", { artworkSlug: "work", published: false, available: true, sold: false }, 200, false, "unavailable"],
	])("returns %s state without a price", async (_name, record, status, available, state) => {
		const response = await handleInventoryRequest("work", async () => record);
		expect(response.status).toBe(status);
		const payload = await response.json();
		expect(payload).toEqual({ artworkSlug: "work", available, status: state });
		expect(JSON.stringify(payload)).not.toContain("price");
	});

	test("returns missing and database-error states", async () => {
		expect((await handleInventoryRequest("missing", async () => null)).status).toBe(404);
		const failure = await handleInventoryRequest("work", async () => { throw new Error("db down"); });
		expect(failure.status).toBe(503);
		expect((await failure.json()).available).toBe(false);
	});
});

describe("checkout", () => {
	test("rejects every client price field", async () => {
		for (const field of ["price", "priceCents", "amount"]) {
			const request = new Request("https://eonmun.test/api/checkout", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ artworkSlug: "work", [field]: 1 }),
			});
			const response = await handleCheckoutRequest(request, "sk_test", async () => { throw new Error("lookup should not run"); });
			expect(response.status).toBe(400);
		}
	});

	test("uses only the trusted server item and returns a 303", async () => {
		let receivedPrice = 0;
		const request = new Request("https://eonmun.test/api/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ artworkSlug: "work" }),
		});
		const response = await handleCheckoutRequest(
			request,
			"sk_test",
			async () => ({ artworkSlug: "work", name: "Work", priceCents: 125000, productId: 7 }),
			async (_secret, item) => { receivedPrice = item.priceCents; return "https://checkout.stripe.com/c/pay/test"; },
		);
		expect(receivedPrice).toBe(125000);
		expect(response.status).toBe(303);
		expect(response.headers.get("location")).toBe("https://checkout.stripe.com/c/pay/test");
	});

	test("refuses checkout for an unavailable artwork", async () => {
		const request = new Request("https://eonmun.test/api/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ artworkSlug: "work" }),
		});
		const response = await handleCheckoutRequest(request, "sk_test", async () => null);
		expect(response.status).toBe(409);
	});

	test("reports malformed input as 400 and hides internal failure detail", async () => {
		const malformed = new Request("https://eonmun.test/api/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: "{not json",
		});
		expect((await handleCheckoutRequest(malformed, "sk_test", async () => null)).status).toBe(400);

		const request = new Request("https://eonmun.test/api/checkout", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ artworkSlug: "work" }),
		});
		const original = console.error;
		console.error = () => {};
		let response: Response;
		try {
			response = await handleCheckoutRequest(request, "sk_test", async () => {
				throw new Error("libsql: connection to primary at db.turso.io failed");
			});
		} finally {
			console.error = original;
		}
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({ error: "Checkout is temporarily unavailable" });
	});

	test("sends the trusted amount to Stripe and keeps local URLs price-free", async () => {
		let stripeBody = "";
		await createStripeCheckoutSession("sk_test", { artworkSlug: "work", name: "Work", priceCents: 125000, productId: 7 }, "https://eonmun.test", async (_url, init) => {
			stripeBody = String(init?.body);
			return Response.json({ url: "https://checkout.stripe.com/c/pay/test" });
		});
		expect(stripeBody).toContain("unit_amount%5D=125000");
		expect(stripeBody).toContain("success_url=https%3A%2F%2Feonmun.test%2Fartworks%2Fwork%3Fcheckout%3Dsuccess");
	});
});
