import { and, desc, eq, isNull } from "drizzle-orm";

import { artworks, getDb, orders, products, type Env, type FulfillmentStatus, type InsertOrder, type SelectOrder } from "./index";
import type { PaidCheckout, PaidOrderResult, PostalAddress } from "../lib/stripe-order";

const UNMATCHED_TITLE = "Unmatched Stripe payment";

function toResult(order: SelectOrder, created: boolean): PaidOrderResult {
	return {
		notification: {
			orderId: order.id,
			artworkTitle: order.artworkTitle,
			amountTotal: order.amountTotal ?? order.itemAmount,
			currency: order.currency,
		},
		created,
		artworkId: order.artworkId,
		productId: order.productId,
		attentionReason: order.attentionReason,
		fulfillmentStatus: order.fulfillmentStatus,
	};
}

function addressColumns<P extends "billing" | "shipping">(prefix: P, address: PostalAddress | null) {
	return {
		[`${prefix}Line1`]: address?.line1 ?? null,
		[`${prefix}Line2`]: address?.line2 ?? null,
		[`${prefix}City`]: address?.city ?? null,
		[`${prefix}State`]: address?.state ?? null,
		[`${prefix}PostalCode`]: address?.postalCode ?? null,
		[`${prefix}Country`]: address?.country ?? null,
	} as Record<`${P}${"Line1" | "Line2" | "City" | "State" | "PostalCode" | "Country"}`, string | null>;
}

/**
 * Stores one order per paid Checkout Session and marks its artwork sold in the
 * same write transaction.
 *
 * CRITICAL: checkout does not reserve inventory, so two buyers can pay for the
 * same one-of-a-kind artwork. The second session is still recorded, flagged
 * artwork_already_sold, so its payment is visible for a refund. A repeated
 * delivery for a session that already has an order returns the stored order
 * untouched and never raises that flag. The unique session index is the
 * backstop if two deliveries race: the loser's insert fails, rolls back its
 * product update, and Stripe retries into the replay path.
 */
export async function recordPaidOrder(env: Env, checkout: PaidCheckout, db = getDb(env)): Promise<PaidOrderResult> {
	return db.transaction(async (tx) => {
		const [existing] = await tx.select().from(orders)
			.where(eq(orders.stripeCheckoutSessionId, checkout.checkoutSessionId));
		if (existing) return toResult(existing, false);

		const [product] = checkout.productId === null ? [] : await tx.select({
			id: products.id,
			price: products.price,
			name: products.name,
			artworkId: products.artworkId,
			artworkTitle: artworks.title,
			artworkSlug: artworks.slug,
		}).from(products).leftJoin(artworks, eq(products.artworkId, artworks.id))
			.where(and(eq(products.id, checkout.productId), eq(products.type, "artwork")));

		let attentionReason: InsertOrder["attentionReason"] = null;
		const now = new Date();
		if (!product) {
			attentionReason = "artwork_not_found";
		} else {
			const sold = await tx.update(products)
				.set({ soldAt: now, quantity: 0, updatedAt: now })
				.where(and(eq(products.id, product.id), isNull(products.soldAt)))
				.returning({ id: products.id });
			if (sold.length === 0) attentionReason = "artwork_already_sold";
		}

		const itemAmount = checkout.amountSubtotal ?? product?.price;
		if (itemAmount === undefined) throw new Error("Paid Checkout Session has no purchased amount");
		const [order] = await tx.insert(orders).values({
			id: crypto.randomUUID(),
			stripeCheckoutSessionId: checkout.checkoutSessionId,
			stripePaymentIntentId: checkout.paymentIntentId,
			stripeCustomerId: checkout.customerId,
			stripeEventId: checkout.eventId,
			stripeEventType: checkout.eventType,
			livemode: checkout.livemode,
			productId: product?.id ?? null,
			artworkId: product?.artworkId ?? null,
			artworkSlug: product?.artworkSlug ?? checkout.artworkSlug,
			artworkTitle: product?.artworkTitle ?? product?.name ?? checkout.artworkSlug ?? UNMATCHED_TITLE,
			itemAmount,
			currency: checkout.currency,
			amountSubtotal: checkout.amountSubtotal,
			amountDiscount: checkout.amountDiscount,
			amountShipping: checkout.amountShipping,
			amountTax: checkout.amountTax,
			amountTotal: checkout.amountTotal,
			buyerEmail: checkout.buyer.email,
			buyerName: checkout.buyer.name,
			buyerBusinessName: checkout.buyer.businessName,
			buyerPhone: checkout.buyer.phone,
			...addressColumns("billing", checkout.buyer.address),
			recipientName: checkout.recipient.name,
			recipientPhone: checkout.recipient.phone,
			...addressColumns("shipping", checkout.recipient.address),
			paidAt: checkout.paidAt,
			attentionReason,
			createdAt: now,
			updatedAt: now,
		}).returning();
		return toResult(order, true);
	});
}

export async function getAdminOrders(env: Env, db = getDb(env)) {
	return db.select({
		id: orders.id,
		paidAt: orders.paidAt,
		artworkTitle: orders.artworkTitle,
		buyerName: orders.buyerName,
		buyerEmail: orders.buyerEmail,
		recipientName: orders.recipientName,
		shippingCity: orders.shippingCity,
		shippingState: orders.shippingState,
		shippingCountry: orders.shippingCountry,
		itemAmount: orders.itemAmount,
		amountTotal: orders.amountTotal,
		currency: orders.currency,
		fulfillmentStatus: orders.fulfillmentStatus,
		attentionReason: orders.attentionReason,
		livemode: orders.livemode,
	}).from(orders).orderBy(desc(orders.paidAt), desc(orders.createdAt));
}

export async function getAdminOrder(env: Env, id: string, db = getDb(env)) {
	const [order] = await db.select().from(orders).where(eq(orders.id, id));
	return order ?? null;
}

export async function updateOrderFulfillment(env: Env, id: string, status: FulfillmentStatus, db = getDb(env)) {
	const [order] = await db.update(orders)
		.set({ fulfillmentStatus: status, updatedAt: new Date() })
		.where(eq(orders.id, id))
		.returning({ id: orders.id, fulfillmentStatus: orders.fulfillmentStatus });
	return order ?? null;
}
