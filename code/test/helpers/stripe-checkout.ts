// Checkout Session events shaped like Stripe API 2025-03-31.basil and later,
// where shipping lives under collected_information.shipping_details.
export function paidCheckoutEvent(overrides: {
	eventId?: string;
	type?: string;
	created?: number;
	session?: Record<string, unknown>;
} = {}) {
	return {
		id: overrides.eventId ?? "evt_paid",
		object: "event",
		type: overrides.type ?? "checkout.session.completed",
		created: overrides.created ?? 1_791_200_000,
		livemode: false,
		data: {
			object: {
				id: "cs_test_paid",
				object: "checkout.session",
				mode: "payment",
				status: "complete",
				payment_status: "paid",
				livemode: false,
				currency: "usd",
				amount_subtotal: 125000,
				amount_total: 125000,
				total_details: { amount_discount: 0, amount_shipping: 0, amount_tax: 0 },
				shipping_cost: { amount_subtotal: 0, amount_tax: 0, amount_total: 0, shipping_rate: "shr_test" },
				customer: null,
				customer_email: null,
				payment_intent: "pi_test_paid",
				metadata: { artworkSlug: "study", productId: "1" },
				customer_details: {
					email: "buyer@example.com",
					name: "Ada Buyer",
					phone: "+15125550100",
					tax_exempt: "none",
					tax_ids: [],
					address: { line1: "1 Billing Way", line2: "Suite 2", city: "Austin", state: "TX", postal_code: "78701", country: "US" },
				},
				collected_information: {
					business_name: null,
					individual_name: null,
					shipping_details: {
						name: "Grace Recipient",
						address: { line1: "9 Gallery Rd", line2: null, city: "Santa Fe", state: "NM", postal_code: "87501", country: "US" },
					},
				},
				...overrides.session,
			},
		},
	};
}
