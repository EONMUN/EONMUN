import { describe, expect, test } from "bun:test";
import { handleStripeWebhook } from "../src/lib/stripe-webhook";

async function signature(secret: string, timestamp: number, body: string) {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
	return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("Stripe webhook", () => {
	test("verifies the raw body and handles a paid Checkout event", async () => {
		const now = Date.now();
		const timestamp = Math.floor(now / 1000);
		const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: { payment_status: "paid", metadata: { artworkSlug: "work", productId: "7" } } } });
		const header = `t=${timestamp},v1=${await signature("whsec_test", timestamp, body)}`;
		let calls = 0;
		const markPaid = async (eventId: string, productId: number, slug: string) => {
			calls += 1;
			expect([eventId, productId, slug]).toEqual(["evt_1", 7, "work"]);
			return calls === 1;
		};
		for (let delivery = 0; delivery < 2; delivery += 1) {
			const response = await handleStripeWebhook(new Request("https://eonmun.test/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": header }, body }), "whsec_test", markPaid, now);
			expect(response.status).toBe(200);
		}
		expect(calls).toBe(2);
	});

	test("rejects an invalid signature before mutation", async () => {
		let calls = 0;
		const response = await handleStripeWebhook(new Request("https://eonmun.test/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "t=1,v1=bad" }, body: "{}" }), "whsec_test", async () => { calls += 1; return true; });
		expect(response.status).toBe(400);
		expect(calls).toBe(0);
	});

	test("handles a signed delayed payment success", async () => {
		const now = Date.now();
		const timestamp = Math.floor(now / 1000);
		const body = JSON.stringify({
			id: "evt_async",
			type: "checkout.session.async_payment_succeeded",
			data: { object: { metadata: { artworkSlug: "delayed-work", productId: "9" } } },
		});
		const header = `t=${timestamp},v1=${await signature("whsec_test", timestamp, body)}`;
		let received: [string, number, string] | null = null;
		const response = await handleStripeWebhook(
			new Request("https://eonmun.test/api/webhooks/stripe", {
				method: "POST",
				headers: { "stripe-signature": header },
				body,
			}),
			"whsec_test",
			async (eventId, productId, artworkSlug) => {
				received = [eventId, productId, artworkSlug];
				return true;
			},
			now,
		);
		expect(response.status).toBe(200);
		expect(received).toEqual(["evt_async", 9, "delayed-work"]);
	});

	test("rejects a signed delayed payment event without a Checkout object", async () => {
		const now = Date.now();
		const timestamp = Math.floor(now / 1000);
		const body = JSON.stringify({
			id: "evt_missing_object",
			type: "checkout.session.async_payment_succeeded",
			data: {},
		});
		const header = `t=${timestamp},v1=${await signature("whsec_test", timestamp, body)}`;
		let calls = 0;
		const response = await handleStripeWebhook(
			new Request("https://eonmun.test/api/webhooks/stripe", {
				method: "POST",
				headers: { "stripe-signature": header },
				body,
			}),
			"whsec_test",
			async () => { calls += 1; return true; },
			now,
		);
		expect(response.status).toBe(400);
		expect(calls).toBe(0);
	});
});
