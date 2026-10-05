import { FULFILLMENT_STATUSES, type FulfillmentStatus, type OrderAttentionReason, type SelectOrder } from "../db/schema/orders";

const ORDER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class OrderInputError extends Error {}

export function isOrderId(value: unknown): value is string {
	return typeof value === "string" && ORDER_ID_PATTERN.test(value);
}

export function parseFulfillmentInput(value: unknown): FulfillmentStatus {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new OrderInputError("Invalid fulfillment request");
	const body = value as Record<string, unknown>;
	if (Object.keys(body).some((key) => key !== "fulfillmentStatus")) {
		throw new OrderInputError("Only fulfillment status can be changed");
	}
	const status = body.fulfillmentStatus;
	if (typeof status !== "string" || !(FULFILLMENT_STATUSES as readonly string[]).includes(status)) {
		throw new OrderInputError("Invalid fulfillment status");
	}
	return status as FulfillmentStatus;
}

export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
	unfulfilled: "To ship",
	shipped: "Shipped",
	delivered: "Delivered",
	cancelled: "Cancelled",
};

export const ATTENTION_LABELS: Record<OrderAttentionReason, { label: string; detail: string }> = {
	artwork_already_sold: {
		label: "Already sold",
		detail: "Another paid order had already marked this artwork sold. Refund or resolve this payment in Stripe before shipping.",
	},
	artwork_not_found: {
		label: "Unmatched artwork",
		detail: "Stripe did not identify an artwork product on this site. Check the payment in Stripe before shipping.",
	},
};

export function formatOrderAmount(cents: number | null, currency: string) {
	if (cents === null) return "Not supplied";
	try {
		return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
	} catch {
		return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
	}
}

type AddressPrefix = "billing" | "shipping";

export function addressLines(order: SelectOrder, prefix: AddressPrefix) {
	const part = (field: "Line1" | "Line2" | "City" | "State" | "PostalCode" | "Country") => order[`${prefix}${field}`];
	const locality = [part("City"), [part("State"), part("PostalCode")].filter(Boolean).join(" ")].filter(Boolean).join(", ");
	return [part("Line1"), part("Line2"), locality, part("Country")].filter((line): line is string => Boolean(line));
}

// Plain text an admin can paste into a carrier's label form.
export function shippingLabel(order: SelectOrder) {
	return [order.recipientName, ...addressLines(order, "shipping"), order.recipientPhone ?? order.buyerPhone]
		.filter((line): line is string => Boolean(line))
		.join("\n");
}

export function stripeDashboardUrl(kind: "payments" | "customers" | "events", id: string, livemode: boolean) {
	return `https://dashboard.stripe.com/${livemode ? "" : "test/"}${kind}/${encodeURIComponent(id)}`;
}
