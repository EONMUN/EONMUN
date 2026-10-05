import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import * as schema from "../src/db/schema";
import { artworks, orders, products } from "../src/db";
import { getAdminOrder, getAdminOrders, recordPaidOrder, updateOrderFulfillment } from "../src/db/orders";
import { parsePaidCheckoutEvent, type PaidCheckout } from "../src/lib/stripe-order";
import { driverErrorMessage } from "../src/lib/driver-error";
import { shippingLabel } from "../src/lib/order-admin";
import { createCatalogSchema } from "./schema-fixture";
import { paidCheckoutEvent } from "./helpers/stripe-checkout";

const env = { TURSO_DATABASE_URL: "https://unused.test" };
let client: Client;
let db: ReturnType<typeof drizzle<typeof schema>>;
let databasePath: string;
let productId: number;
let artworkId: number;

function checkout(overrides: Parameters<typeof paidCheckoutEvent>[0] = {}): PaidCheckout {
	return parsePaidCheckoutEvent(paidCheckoutEvent({
		...overrides,
		session: { metadata: { artworkSlug: "study", artworkTitle: "Study", productId: String(productId) }, ...overrides.session },
	}))!;
}

async function failure(run: () => Promise<unknown>) {
	try {
		await run();
	} catch (error) {
		return driverErrorMessage(error, "");
	}
	return null;
}

const product = async () => (await db.select().from(products).where(eq(products.id, productId)))[0];

beforeEach(async () => {
	databasePath = `/tmp/eonmun-orders-test-${crypto.randomUUID()}.db`;
	client = createClient({ url: `file:${databasePath}` });
	db = drizzle(client, { schema });
	await createCatalogSchema(client);
	const [artwork] = await db.insert(artworks).values({ title: "Study", slug: "study", publishedAt: new Date() }).returning();
	artworkId = artwork.id;
	const [row] = await db.insert(products).values({ type: "artwork", artworkId, name: "Study", slug: "study", price: 125000, quantity: 1 }).returning();
	productId = row.id;
});

afterEach(async () => {
	client.close();
	await unlink(databasePath).catch(() => undefined);
});

describe("paid orders", () => {
	test("stores the buyer, billing address, recipient, shipping address, totals, and Stripe references", async () => {
		const result = await recordPaidOrder(env, checkout({ session: { customer: "cus_123", amount_total: 133531, total_details: { amount_discount: 500, amount_shipping: 0, amount_tax: 9031 } } }), null, db);
		expect(result).toEqual({
			notification: { orderId: expect.any(String), artworkTitle: "Study", amountTotal: 133531, currency: "usd" },
			created: true,
			artworkId,
			productId,
			attentionReason: null,
			fulfillmentStatus: "unfulfilled",
		});
		const order = await getAdminOrder(env, result.notification.orderId, db);
		expect(order).toMatchObject({
			stripeCheckoutSessionId: "cs_test_paid",
			stripePaymentIntentId: "pi_test_paid",
			stripeCustomerId: "cus_123",
			stripeEventId: "evt_paid",
			stripeEventType: "checkout.session.completed",
			livemode: false,
			productId,
			artworkId,
			artworkSlug: "study",
			artworkTitle: "Study",
			artworkTitleSource: "checkout",
			itemAmount: 125000,
			amountSubtotal: 125000,
			amountDiscount: 500,
			amountShipping: 0,
			amountTax: 9031,
			amountTotal: 133531,
			buyerEmail: "buyer@example.com",
			buyerName: "Ada Buyer",
			buyerPhone: "+15125550100",
			billingLine1: "1 Billing Way",
			billingLine2: "Suite 2",
			billingCity: "Austin",
			billingState: "TX",
			billingPostalCode: "78701",
			billingCountry: "US",
			recipientName: "Grace Recipient",
			recipientPhone: null,
			shippingLine1: "9 Gallery Rd",
			shippingLine2: null,
			shippingCity: "Santa Fe",
			shippingState: "NM",
			shippingPostalCode: "87501",
			shippingCountry: "US",
			paidAt: new Date(1_791_200_000 * 1000),
			fulfillmentStatus: "unfulfilled",
			attentionReason: null,
		});
		expect(shippingLabel(order!)).toBe("Grace Recipient\n9 Gallery Rd\nSanta Fe, NM 87501\nUS\n+15125550100");
		const sold = await product();
		expect(sold.quantity).toBe(0);
		expect(sold.soldAt).toBeInstanceOf(Date);
		// No column holds the raw Stripe payload.
		expect(Object.keys(order!).some((key) => /payload|raw|json/i.test(key))).toBe(false);
	});

	test("replays and later events for the same session return the stored order without a false double-sale", async () => {
		const first = await recordPaidOrder(env, checkout(), null, db);
		const soldAt = (await product()).soldAt;
		await db.update(artworks).set({ title: "Renamed study" }).where(eq(artworks.id, artworkId));
		await db.update(products).set({ price: 1 }).where(eq(products.id, productId));

		const replay = await recordPaidOrder(env, checkout(), null, db);
		const delayed = await recordPaidOrder(env, checkout({ eventId: "evt_async", type: "checkout.session.async_payment_succeeded" }), null, db);
		for (const result of [replay, delayed]) {
			expect(result.created).toBe(false);
			expect(result.attentionReason).toBeNull();
			expect(result.notification).toEqual(first.notification);
		}
		expect(first.notification.artworkTitle).toBe("Study");
		expect(await db.select().from(orders)).toHaveLength(1);
		expect((await product()).soldAt).toEqual(soldAt);
	});

	test("records a delayed payment confirmed by checkout.session.async_payment_succeeded", async () => {
		const result = await recordPaidOrder(env, checkout({ eventId: "evt_async", type: "checkout.session.async_payment_succeeded" }), null, db);
		const order = await getAdminOrder(env, result.notification.orderId, db);
		expect(order?.stripeEventType).toBe("checkout.session.async_payment_succeeded");
		expect(order?.stripeEventId).toBe("evt_async");
		expect((await product()).soldAt).toBeInstanceOf(Date);
	});

	test("records a separate paid session for an already-sold artwork and flags it", async () => {
		const first = await recordPaidOrder(env, checkout(), null, db);
		const second = await recordPaidOrder(env, checkout({
			eventId: "evt_second",
			session: { id: "cs_test_second", payment_intent: "pi_test_second", customer_details: { email: "second@example.com", name: "Second Buyer" } },
		}), null, db);
		expect(second.created).toBe(true);
		expect(second.attentionReason).toBe("artwork_already_sold");
		expect(second.notification.orderId).not.toBe(first.notification.orderId);
		expect(second.notification).toMatchObject({ artworkTitle: "Study", amountTotal: 125000, currency: "usd" });
		const stored = await db.select({ session: orders.stripeCheckoutSessionId, attention: orders.attentionReason, email: orders.buyerEmail }).from(orders);
		expect(stored).toHaveLength(2);
		expect(stored).toContainEqual({ session: "cs_test_paid", attention: null, email: "buyer@example.com" });
		expect(stored).toContainEqual({ session: "cs_test_second", attention: "artwork_already_sold", email: "second@example.com" });
		// Replaying the flagged session keeps it flagged without adding a third row.
		const replay = await recordPaidOrder(env, checkout({ eventId: "evt_second", session: { id: "cs_test_second" } }), null, db);
		expect([replay.created, replay.attentionReason, replay.notification.orderId]).toEqual([false, "artwork_already_sold", second.notification.orderId]);
		expect(await db.select().from(orders)).toHaveLength(2);
	});

	test("keeps a paid session with no matching artwork product instead of discarding it", async () => {
		const result = await recordPaidOrder(env, checkout({ session: { metadata: {} } }), null, db);
		expect(result).toMatchObject({ created: true, attentionReason: "artwork_not_found", artworkId: null, productId: null });
		expect(result.notification).toMatchObject({ artworkTitle: "Unmatched Stripe payment", amountTotal: 125000 });
		expect((await getAdminOrder(env, result.notification.orderId, db))?.artworkTitleSource).toBe("unmatched");
		expect((await product()).soldAt).toBeNull();
	});

	test("rolls back the sold mark when the order cannot be stored", async () => {
		const invalid = { ...checkout(), currency: null } as unknown as PaidCheckout;
		// The product update runs first, so this proves the insert failure undoes it.
		expect(await failure(() => recordPaidOrder(env, invalid, null, db))).toContain("NOT NULL constraint failed: orders.currency");
		const unsold = await product();
		expect(unsold.soldAt).toBeNull();
		expect(unsold.quantity).toBe(1);
		expect(await db.select().from(orders)).toHaveLength(0);
	});

	test("the unique session index rejects a second row for one Checkout Session", async () => {
		const { notification } = await recordPaidOrder(env, checkout(), null, db);
		const [row] = await db.select().from(orders).where(eq(orders.id, notification.orderId));
		expect(await failure(async () => db.insert(orders).values({ ...row, id: crypto.randomUUID() }))).toContain("UNIQUE constraint failed: orders.stripe_checkout_session_id");
	});

	test("lists newest orders first and updates fulfillment status", async () => {
		const older = await recordPaidOrder(env, checkout({ created: 1_791_100_000 }), null, db);
		const newer = await recordPaidOrder(env, checkout({ eventId: "evt_newer", created: 1_791_300_000, session: { id: "cs_test_newer" } }), null, db);
		expect((await getAdminOrders(env, db)).map((order) => order.id)).toEqual([newer.notification.orderId, older.notification.orderId]);
		expect(await updateOrderFulfillment(env, older.notification.orderId, "shipped", db)).toEqual({ id: older.notification.orderId, fulfillmentStatus: "shipped" });
		expect(await updateOrderFulfillment(env, crypto.randomUUID(), "shipped", db)).toBeNull();
		expect(await failure(async () => db.update(orders).set({ fulfillmentStatus: "lost" as never }).where(eq(orders.id, older.notification.orderId)))).toContain("CHECK constraint failed");
	});

	test("keeps the title and slug shown at Checkout when the artwork is renamed before payment", async () => {
		const opened = checkout();
		const delayedOpen = checkout({ eventId: "evt_delayed", type: "checkout.session.async_payment_succeeded", session: { id: "cs_test_delayed" } });
		await db.update(artworks).set({ title: "Renamed study", slug: "renamed-study" }).where(eq(artworks.id, artworkId));
		const lookups: string[] = [];
		const lookup = async (sessionId: string) => { lookups.push(sessionId); return "Stripe line item"; };

		for (const paid of [opened, delayedOpen]) {
			const result = await recordPaidOrder(env, paid, lookup, db);
			expect(result.notification.artworkTitle).toBe("Study");
			expect(result.artworkId).toBe(artworkId);
			expect(result.productId).toBe(productId);
			const order = await getAdminOrder(env, result.notification.orderId, db);
			expect(order).toMatchObject({ artworkTitle: "Study", artworkTitleSource: "checkout", artworkSlug: "study", currentArtworkSlug: "renamed-study" });
		}
		// Checkout metadata already names the purchase, so Stripe is never asked.
		expect(lookups).toEqual([]);
	});

	test("asks Stripe for the line item name of a session created without title metadata", async () => {
		const legacy = checkout({ session: { metadata: { artworkSlug: "study", productId: String(productId) } } });
		await db.update(artworks).set({ title: "Renamed study", slug: "renamed-study" }).where(eq(artworks.id, artworkId));
		const lookups: string[] = [];
		const lookup = async (sessionId: string) => { lookups.push(sessionId); return "Study"; };

		const first = await recordPaidOrder(env, legacy, lookup, db);
		expect(first.notification.artworkTitle).toBe("Study");
		expect(await getAdminOrder(env, first.notification.orderId, db)).toMatchObject({ artworkTitleSource: "stripe_line_item", artworkSlug: "study" });
		const replay = await recordPaidOrder(env, legacy, lookup, db);
		expect(replay.notification).toEqual(first.notification);
		expect(lookups).toEqual(["cs_test_paid"]);
	});

	test("labels a catalog title when Stripe has no line item name or no key is configured", async () => {
		const legacy = (id: string) => checkout({ eventId: `evt_${id}`, session: { id, metadata: { artworkSlug: "study", productId: String(productId) } } });
		const empty = await recordPaidOrder(env, legacy("cs_test_empty"), async () => null, db);
		const unconfigured = await recordPaidOrder(env, legacy("cs_test_nokey"), null, db);
		for (const result of [empty, unconfigured]) {
			expect(result.notification.artworkTitle).toBe("Study");
			expect((await getAdminOrder(env, result.notification.orderId, db))?.artworkTitleSource).toBe("catalog");
		}
	});

	test("stores nothing when the Stripe line item lookup fails, so Stripe retries", async () => {
		const legacy = checkout({ session: { metadata: { artworkSlug: "study", productId: String(productId) } } });
		const message = await failure(() => recordPaidOrder(env, legacy, async () => { throw new Error("Stripe line item lookup returned HTTP 503"); }, db));
		expect(message).toBe("Stripe line item lookup returned HTTP 503");
		expect(await db.select().from(orders)).toHaveLength(0);
		expect((await product()).soldAt).toBeNull();
	});
});
