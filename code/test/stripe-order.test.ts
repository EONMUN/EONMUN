import { describe, expect, test } from "bun:test";
import { parsePaidCheckoutEvent, StripeEventError } from "../src/lib/stripe-order";
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
		expect(checkout?.amountTax).toBeNull();
	});

	test("rejects a paid event without a Checkout Session ID", () => {
		expect(() => parsePaidCheckoutEvent(paidCheckoutEvent({ session: { id: undefined } }))).toThrow(StripeEventError);
		expect(() => parsePaidCheckoutEvent({ id: "evt", type: "checkout.session.async_payment_succeeded", data: {} })).toThrow(StripeEventError);
	});
});
