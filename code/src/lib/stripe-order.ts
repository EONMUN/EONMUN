import type { FulfillmentStatus, OrderAttentionReason } from "../db/schema/orders";

export const PAID_CHECKOUT_EVENT_TYPES = ["checkout.session.completed", "checkout.session.async_payment_succeeded"] as const;

export interface PostalAddress {
	line1: string | null;
	line2: string | null;
	city: string | null;
	state: string | null;
	postalCode: string | null;
	country: string | null;
}

export interface PaidCheckout {
	eventId: string;
	eventType: (typeof PAID_CHECKOUT_EVENT_TYPES)[number];
	livemode: boolean;
	checkoutSessionId: string;
	paymentIntentId: string | null;
	customerId: string | null;
	productId: number | null;
	artworkSlug: string | null;
	currency: string;
	amountSubtotal: number | null;
	amountDiscount: number | null;
	amountShipping: number | null;
	amountTax: number | null;
	amountTotal: number | null;
	buyer: {
		email: string | null;
		name: string | null;
		businessName: string | null;
		phone: string | null;
		address: PostalAddress | null;
	};
	recipient: {
		name: string | null;
		phone: string | null;
		address: PostalAddress | null;
	};
	paidAt: Date;
}

// The shape the webhook orchestration layer hands to admin sale notifications.
// It is read back from the stored order, so a replayed delivery reports the
// title and amount captured at payment time.
export interface PaidOrderNotification {
	orderId: string;
	artworkTitle: string;
	amountTotal: number;
	currency: string;
}

export interface PaidOrderResult {
	notification: PaidOrderNotification;
	created: boolean;
	artworkId: number | null;
	productId: number | null;
	attentionReason: OrderAttentionReason | null;
	fulfillmentStatus: FulfillmentStatus;
}

export class StripeEventError extends Error {}

type Fields = Record<string, unknown>;

function record(value: unknown): Fields | null {
	return value && typeof value === "object" && !Array.isArray(value) ? value as Fields : null;
}

function text(value: unknown) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed ? trimmed : null;
}

function amount(value: unknown) {
	return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

// Webhook payloads normally carry IDs, but an expanded object must not be
// stored as "[object Object]".
function reference(value: unknown) {
	return text(value) ?? text(record(value)?.id);
}

function address(value: unknown): PostalAddress | null {
	const fields = record(value);
	if (!fields) return null;
	const parsed = {
		line1: text(fields.line1),
		line2: text(fields.line2),
		city: text(fields.city),
		state: text(fields.state),
		postalCode: text(fields.postal_code),
		country: text(fields.country),
	};
	return Object.values(parsed).some((part) => part !== null) ? parsed : null;
}

/**
 * Returns the paid Checkout Session carried by a verified Stripe event, or null
 * for events that do not represent a completed payment.
 *
 * CRITICAL: the webhook endpoint follows the Stripe account's default API
 * version. From 2025-03-31.basil shipping lives under
 * collected_information.shipping_details; earlier versions use the top-level
 * shipping_details field. Both are read so an account upgrade cannot silently
 * drop recipient addresses.
 */
export function parsePaidCheckoutEvent(value: unknown): PaidCheckout | null {
	const event = record(value);
	const type = event?.type;
	if (type !== "checkout.session.completed" && type !== "checkout.session.async_payment_succeeded") return null;
	const session = record(record(event?.data)?.object);
	// A completed session paid by a delayed method stays unpaid until
	// checkout.session.async_payment_succeeded arrives.
	if (type === "checkout.session.completed" && session?.payment_status !== "paid") return null;
	const eventId = text(event?.id);
	const checkoutSessionId = text(session?.id);
	if (!session || !eventId || !checkoutSessionId) throw new StripeEventError("Invalid Stripe event");

	const metadata = record(session.metadata);
	const productId = Number(metadata?.productId);
	const details = record(session.customer_details);
	const collected = record(session.collected_information);
	const shipping = record(collected?.shipping_details) ?? record(session.shipping_details);
	const totals = record(session.total_details);
	const created = amount(event?.created);

	return {
		eventId,
		eventType: type,
		livemode: session.livemode === true || event?.livemode === true,
		checkoutSessionId,
		paymentIntentId: reference(session.payment_intent),
		customerId: reference(session.customer),
		productId: Number.isSafeInteger(productId) && productId > 0 ? productId : null,
		artworkSlug: text(metadata?.artworkSlug),
		currency: text(session.currency)?.toLowerCase() ?? "usd",
		amountSubtotal: amount(session.amount_subtotal),
		amountDiscount: amount(totals?.amount_discount),
		amountShipping: amount(totals?.amount_shipping) ?? amount(record(session.shipping_cost)?.amount_total),
		amountTax: amount(totals?.amount_tax),
		amountTotal: amount(session.amount_total),
		buyer: {
			email: text(details?.email) ?? text(session.customer_email),
			name: text(details?.name) ?? text(details?.individual_name) ?? text(collected?.individual_name),
			businessName: text(details?.business_name) ?? text(collected?.business_name),
			phone: text(details?.phone),
			address: address(details?.address),
		},
		recipient: {
			name: text(shipping?.name),
			// Checkout collects one phone number, on customer_details. A recipient
			// phone is kept only when Stripe supplies one with the shipping details.
			phone: text(shipping?.phone),
			address: address(shipping?.address),
		},
		paidAt: created === null ? new Date() : new Date(created * 1000),
	};
}
