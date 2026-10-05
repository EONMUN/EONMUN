import { describe, expect, test } from "bun:test";
import { handleStripeWebhook } from "../src/lib/stripe-webhook";
import type { PaidCheckout, PaidOrderResult } from "../src/lib/stripe-order";
import { paidCheckoutEvent } from "./helpers/stripe-checkout";

const SECRET = "whsec_test";

async function signature(secret: string, timestamp: number, body: string) {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
	return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function signedRequest(event: unknown, now = Date.now(), timestamp = Math.floor(now / 1000)) {
	const body = JSON.stringify(event);
	return new Request("https://eonmun.test/api/webhooks/stripe", {
		method: "POST",
		headers: { "stripe-signature": `t=${timestamp},v1=${await signature(SECRET, timestamp, body)}` },
		body,
	});
}

function orderResult(overrides: Partial<PaidOrderResult> = {}): PaidOrderResult {
	return {
		notification: { orderId: "4b9c1c8e-3f0a-4d1e-9b6a-2a8d7f1c0e11", artworkTitle: "Work", amountTotal: 125000, currency: "usd" },
		created: true,
		artworkId: 3,
		productId: 7,
		attentionReason: null,
		fulfillmentStatus: "unfulfilled",
		...overrides,
	};
}

async function captureErrors(run: () => Promise<void>) {
	const errors: string[] = [];
	const original = console.error;
	console.error = (line: string) => { errors.push(line); };
	try {
		await run();
	} finally {
		console.error = original;
	}
	return errors;
}

describe("Stripe webhook", () => {
	test("verifies the raw body and hands the paid Checkout Session to order persistence", async () => {
		const received: PaidCheckout[] = [];
		const response = await handleStripeWebhook(
			await signedRequest(paidCheckoutEvent({ eventId: "evt_1", session: { metadata: { artworkSlug: "work", productId: "7" } } })),
			SECRET,
			async (checkout) => { received.push(checkout); return orderResult(); },
		);
		expect(response.status).toBe(200);
		expect(received).toHaveLength(1);
		expect(received[0]).toMatchObject({
			eventId: "evt_1",
			checkoutSessionId: "cs_test_paid",
			productId: 7,
			artworkSlug: "work",
			recipient: { name: "Grace Recipient", address: { line1: "9 Gallery Rd" } },
		});
	});

	test("accepts the unpaid deployment probe without touching orders", async () => {
		// The exact body scripts/configure-stripe.ts sends after installing a signing secret.
		let calls = 0;
		const response = await handleStripeWebhook(
			await signedRequest({ id: "evt_eonmun_configuration_check", type: "checkout.session.completed", data: { object: { payment_status: "unpaid" } } }),
			SECRET,
			async () => { calls += 1; return orderResult(); },
		);
		expect(response.status).toBe(200);
		expect(calls).toBe(0);
	});

	test("ignores an unpaid Checkout session", async () => {
		let calls = 0;
		const response = await handleStripeWebhook(
			await signedRequest(paidCheckoutEvent({ session: { payment_status: "unpaid" } })),
			SECRET,
			async () => { calls += 1; return orderResult(); },
		);
		expect(response.status).toBe(200);
		expect(calls).toBe(0);
	});

	test("handles a signed delayed payment success", async () => {
		let received: PaidCheckout | null = null;
		const response = await handleStripeWebhook(
			await signedRequest(paidCheckoutEvent({
				eventId: "evt_async",
				type: "checkout.session.async_payment_succeeded",
				session: { metadata: { artworkSlug: "delayed-work", productId: "9" } },
			})),
			SECRET,
			async (checkout) => { received = checkout; return orderResult(); },
		);
		expect(response.status).toBe(200);
		expect(received).toMatchObject({ eventId: "evt_async", eventType: "checkout.session.async_payment_succeeded", productId: 9, artworkSlug: "delayed-work" });
	});

	test("logs a newly flagged double sale once, without buyer details", async () => {
		const event = paidCheckoutEvent({ eventId: "evt_dup", session: { metadata: { artworkSlug: "work", productId: "7" } } });
		const errors = await captureErrors(async () => {
			const flagged = orderResult({ attentionReason: "artwork_already_sold" });
			expect((await handleStripeWebhook(await signedRequest(event), SECRET, async () => flagged)).status).toBe(200);
			// A replay of the same flagged order is not a new problem.
			expect((await handleStripeWebhook(await signedRequest(event), SECRET, async () => ({ ...flagged, created: false }))).status).toBe(200);
		});
		expect(errors).toHaveLength(1);
		expect(JSON.parse(errors[0])).toEqual({
			message: "stripe paid order needs attention",
			reason: "artwork_already_sold",
			orderId: "4b9c1c8e-3f0a-4d1e-9b6a-2a8d7f1c0e11",
			eventId: "evt_dup",
			checkoutSessionId: "cs_test_paid",
			productId: 7,
			artworkSlug: "work",
		});
		expect(errors[0]).not.toContain("buyer@example.com");
	});

	test("asks Stripe to retry when the order cannot be stored, without logging buyer details", async () => {
		const errors = await captureErrors(async () => {
			const response = await handleStripeWebhook(await signedRequest(paidCheckoutEvent()), SECRET, async () => {
				// Drizzle's wrapper repeats every bound parameter; only the cause is safe to log.
				throw new Error("Failed query: insert into orders params: buyer@example.com,Ada Buyer,9 Gallery Rd", {
					cause: new Error("SQLITE_BUSY: database is locked"),
				});
			});
			expect(response.status).toBe(500);
		});
		expect(errors).toHaveLength(1);
		expect(JSON.parse(errors[0])).toEqual({
			message: "stripe paid order could not be processed",
			eventId: "evt_paid",
			checkoutSessionId: "cs_test_paid",
			error: "SQLITE_BUSY: database is locked",
		});
		for (const detail of ["buyer@example.com", "Ada Buyer", "Gallery", "+1512"]) expect(errors[0]).not.toContain(detail);
	});

	test("rejects a correctly signed event outside the tolerance window", async () => {
		const now = Date.now();
		let calls = 0;
		const response = await handleStripeWebhook(
			await signedRequest(paidCheckoutEvent(), now, Math.floor(now / 1000) - 400),
			SECRET,
			async () => { calls += 1; return orderResult(); },
			now,
		);
		expect(response.status).toBe(400);
		expect(calls).toBe(0);
	});

	test("rejects an invalid signature before mutation", async () => {
		let calls = 0;
		const response = await handleStripeWebhook(
			new Request("https://eonmun.test/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "t=1,v1=bad" }, body: "{}" }),
			SECRET,
			async () => { calls += 1; return orderResult(); },
		);
		expect(response.status).toBe(400);
		expect(calls).toBe(0);
	});

	test("rejects a signed paid event without a Checkout Session", async () => {
		let calls = 0;
		for (const event of [
			{ id: "evt_missing_object", type: "checkout.session.async_payment_succeeded", data: {} },
			paidCheckoutEvent({ session: { id: null } }),
		]) {
			const response = await handleStripeWebhook(await signedRequest(event), SECRET, async () => { calls += 1; return orderResult(); });
			expect(response.status).toBe(400);
		}
		expect(calls).toBe(0);
	});
});
