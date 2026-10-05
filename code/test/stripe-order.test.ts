import { describe, expect, test } from "bun:test";
import { fetchCheckoutLineItemTitle, parsePaidCheckoutEvent, StripeEventError } from "../src/lib/stripe-order";
import { paidCheckoutEvent } from "./helpers/stripe-checkout";

describe("paid Checkout parsing", () => {
	test("reads buyer, billing, recipient, totals, and references from a current Checkout Session", () => {
		const checkout = parsePaidCheckoutEvent(paidCheckoutEvent({
			session: { customer: "cus_123", total_details: { amount_discount: 500, amount_shipping: 0, amount_tax: 1031 } },
		}));
		expect(checkout).toEqual({
			eventId: "evt_paid",
			eventType: "checkout.session.completed",
			livemode: false,
			checkoutSessionId: "cs_test_paid",
			paymentIntentId: "pi_test_paid",
			customerId: "cus_123",
			productId: 1,
			artworkSlug: "study",
			artworkTitle: "Study",
			currency: "usd",
			amountSubtotal: 125000,
			amountDiscount: 500,
			amountShipping: 0,
			amountTax: 1031,
			amountTotal: 125000,
			buyer: {
				email: "buyer@example.com",
				name: "Ada Buyer",
				businessName: null,
				phone: "+15125550100",
				address: { line1: "1 Billing Way", line2: "Suite 2", city: "Austin", state: "TX", postalCode: "78701", country: "US" },
			},
			recipient: {
				name: "Grace Recipient",
				phone: null,
				address: { line1: "9 Gallery Rd", line2: null, city: "Santa Fe", state: "NM", postalCode: "87501", country: "US" },
			},
			paidAt: new Date(1_791_200_000 * 1000),
		});
	});

	test("reads the top-level shipping_details used before API 2025-03-31.basil", () => {
		const checkout = parsePaidCheckoutEvent(paidCheckoutEvent({
			session: {
				collected_information: undefined,
				shipping_details: { name: "Legacy Recipient", address: { line1: "5 Old St", city: "Reno", state: "NV", postal_code: "89501", country: "US" } },
			},
		}));
		expect(checkout?.recipient).toEqual({
			name: "Legacy Recipient",
			phone: null,
			address: { line1: "5 Old St", line2: null, city: "Reno", state: "NV", postalCode: "89501", country: "US" },
		});
	});

	test("ignores unpaid completions and unrelated events", () => {
		expect(parsePaidCheckoutEvent(paidCheckoutEvent({ session: { payment_status: "unpaid" } }))).toBeNull();
		expect(parsePaidCheckoutEvent(paidCheckoutEvent({ type: "checkout.session.async_payment_failed" }))).toBeNull();
		expect(parsePaidCheckoutEvent(paidCheckoutEvent({ type: "checkout.session.expired" }))).toBeNull();
	});

	test("treats a delayed payment success as paid", () => {
		const checkout = parsePaidCheckoutEvent(paidCheckoutEvent({ eventId: "evt_async", type: "checkout.session.async_payment_succeeded" }));
		expect(checkout?.eventType).toBe("checkout.session.async_payment_succeeded");
		expect(checkout?.checkoutSessionId).toBe("cs_test_paid");
	});

	test("does not require optional details Stripe may omit", () => {
		const checkout = parsePaidCheckoutEvent(paidCheckoutEvent({
			session: {
				customer_details: { email: "only@example.com", name: null, phone: null, address: null },
				collected_information: null,
				payment_intent: { id: "pi_expanded", object: "payment_intent" },
				total_details: null,
				shipping_cost: null,
				metadata: {},
			},
		}));
		expect(checkout?.buyer).toEqual({ email: "only@example.com", name: null, businessName: null, phone: null, address: null });
		expect(checkout?.recipient).toEqual({ name: null, phone: null, address: null });
		expect(checkout?.paymentIntentId).toBe("pi_expanded");
		expect(checkout?.productId).toBeNull();
		expect(checkout?.artworkTitle).toBeNull();
		expect(checkout?.amountTax).toBeNull();
	});

	test("rejects a paid event without a Checkout Session ID", () => {
		expect(() => parsePaidCheckoutEvent(paidCheckoutEvent({ session: { id: undefined } }))).toThrow(StripeEventError);
		expect(() => parsePaidCheckoutEvent({ id: "evt", type: "checkout.session.async_payment_succeeded", data: {} })).toThrow(StripeEventError);
	});
});

describe("Stripe line item lookup", () => {
	test("reads the first line item name with server credentials without following redirects", async () => {
		const requests: Array<[string, RequestInit | undefined]> = [];
		const title = await fetchCheckoutLineItemTitle("sk_test_key", "cs_test_abc123", async (url, init) => {
			requests.push([String(url), init]);
			return Response.json({ object: "list", data: [{ object: "item", description: "Study" }], has_more: false });
		});
		expect(title).toBe("Study");
		expect(requests).toHaveLength(1);
		expect(requests[0][0]).toBe("https://api.stripe.com/v1/checkout/sessions/cs_test_abc123/line_items?limit=1");
		expect(requests[0][1]?.headers).toEqual({ authorization: "Bearer sk_test_key" });
		// Workers accept only "follow" or "manual".
		expect(requests[0][1]?.redirect).toBe("manual");
		expect(requests[0][1]?.signal).toBeInstanceOf(AbortSignal);
	});

	test("returns null for a session with no line items", async () => {
		expect(await fetchCheckoutLineItemTitle("sk_test_key", "cs_test_abc123", async () => Response.json({ data: [] }))).toBeNull();
	});

	test("throws without echoing Stripe's response body", async () => {
		const failure = fetchCheckoutLineItemTitle("sk_test_key", "cs_test_abc123", async () => Response.json({ error: { message: "secret detail" } }, { status: 401 }));
		await expect(failure).rejects.toThrow(/^Stripe line item lookup returned HTTP 401$/);
	});

	test("rejects a redirect instead of following it with the secret key", async () => {
		for (const status of [301, 302, 307, 308]) {
			let calls = 0;
			const failure = fetchCheckoutLineItemTitle("sk_test_key", "cs_test_abc123", async () => {
				calls += 1;
				return new Response(null, { status, headers: { location: "https://elsewhere.test/collect" } });
			});
			await expect(failure).rejects.toThrow(new RegExp(`^Stripe line item lookup refused a redirect \\(HTTP ${status}\\)$`));
			expect(calls).toBe(1);
		}
	});

	test("refuses a malformed session ID before contacting Stripe", async () => {
		let calls = 0;
		const failure = fetchCheckoutLineItemTitle("sk_test_key", "cs_test_abc/../../customers", async () => { calls += 1; return Response.json({}); });
		await expect(failure).rejects.toThrow("Invalid Checkout Session ID");
		expect(calls).toBe(0);
	});
});
