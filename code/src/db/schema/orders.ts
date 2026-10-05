import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { artworks, products } from "./artworks";

export const FULFILLMENT_STATUSES = ["unfulfilled", "shipped", "delivered", "cancelled"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const ORDER_ATTENTION_REASONS = ["artwork_already_sold", "artwork_not_found"] as const;
export type OrderAttentionReason = (typeof ORDER_ATTENTION_REASONS)[number];

// One row per paid Stripe Checkout Session. Artwork, title, and amounts are
// snapshots taken when payment was recorded, so later catalog edits never
// rewrite what the buyer paid for.
export const orders = sqliteTable(
	"orders",
	{
		id: text("id").primaryKey(),
		stripeCheckoutSessionId: text("stripe_checkout_session_id").notNull(),
		stripePaymentIntentId: text("stripe_payment_intent_id"),
		stripeCustomerId: text("stripe_customer_id"),
		stripeEventId: text("stripe_event_id").notNull(),
		stripeEventType: text("stripe_event_type").notNull(),
		livemode: integer("livemode", { mode: "boolean" }).notNull(),
		productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
		artworkId: integer("artwork_id").references(() => artworks.id, { onDelete: "set null" }),
		artworkSlug: text("artwork_slug"),
		artworkTitle: text("artwork_title").notNull(),
		itemAmount: integer("item_amount").notNull(),
		currency: text("currency").notNull(),
		amountSubtotal: integer("amount_subtotal"),
		amountDiscount: integer("amount_discount"),
		amountShipping: integer("amount_shipping"),
		amountTax: integer("amount_tax"),
		amountTotal: integer("amount_total"),
		buyerEmail: text("buyer_email"),
		buyerName: text("buyer_name"),
		buyerBusinessName: text("buyer_business_name"),
		buyerPhone: text("buyer_phone"),
		billingLine1: text("billing_line1"),
		billingLine2: text("billing_line2"),
		billingCity: text("billing_city"),
		billingState: text("billing_state"),
		billingPostalCode: text("billing_postal_code"),
		billingCountry: text("billing_country"),
		recipientName: text("recipient_name"),
		recipientPhone: text("recipient_phone"),
		shippingLine1: text("shipping_line1"),
		shippingLine2: text("shipping_line2"),
		shippingCity: text("shipping_city"),
		shippingState: text("shipping_state"),
		shippingPostalCode: text("shipping_postal_code"),
		shippingCountry: text("shipping_country"),
		paidAt: integer("paid_at", { mode: "timestamp" }).notNull(),
		fulfillmentStatus: text("fulfillment_status", { enum: FULFILLMENT_STATUSES }).notNull().default("unfulfilled"),
		attentionReason: text("attention_reason", { enum: ORDER_ATTENTION_REASONS }),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		uniqueIndex("orders_stripe_checkout_session_unique").on(table.stripeCheckoutSessionId),
		index("orders_paid_at_idx").on(table.paidAt),
		index("orders_product_idx").on(table.productId),
	],
);

export type InsertOrder = typeof orders.$inferInsert;
export type SelectOrder = typeof orders.$inferSelect;
