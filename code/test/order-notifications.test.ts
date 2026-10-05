import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { adminOrderNotifications, adminPushDeliveries, artworks, orders, products } from "../src/db";
import { upsertAdminPushSubscription } from "../src/db/admin-push";
import { recordPaidOrder } from "../src/db/orders";
import { enqueueOrderNotification, type AdminPushEnv } from "../src/lib/push/dispatch";
import { handleStripeWebhook } from "../src/lib/stripe-webhook";
import { browserKeys, createMigratedDb, vapidKeys } from "./helpers/push";
import { paidCheckoutEvent } from "./helpers/stripe-checkout";

// The Stripe route's orchestration with real order storage and the real alert
// queue; only the Cloudflare request context and push network are absent.
const SECRET = "whsec_test";
let store: Awaited<ReturnType<typeof createMigratedDb>>;
let env: AdminPushEnv;
let productId: number;

beforeEach(async () => {
	store = await createMigratedDb();
	env = { TURSO_DATABASE_URL: "https://unused.test", ADMIN_EMAILS: "admin@example.com", ...await vapidKeys() };
	const [artwork] = await store.db.insert(artworks).values({ title: "Study", slug: "study", publishedAt: new Date() }).returning();
	[{ id: productId }] = await store.db.insert(products).values({ type: "artwork", artworkId: artwork.id, name: "Study", slug: "study", price: 125000, quantity: 1 }).returning();
	const keys = await browserKeys();
	await upsertAdminPushSubscription(env, { id: "google-admin", email: "admin@example.com" },
		{ endpoint: "https://web.push.apple.com/device", p256dh: keys.p256dh, auth: keys.authText }, env.VAPID_PUBLIC_KEY!, null, new Date(Date.now() - 60_000), store.db);
});
afterEach(() => store.close());

async function signed(event: unknown) {
	const body = JSON.stringify(event);
	const timestamp = Math.floor(Date.now() / 1000);
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)));
	const hex = [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
	return new Request("https://eonmun.test/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": `t=${timestamp},v1=${hex}` }, body });
}

const paid = () => paidCheckoutEvent({ session: { metadata: { artworkSlug: "study", artworkTitle: "Study", productId: String(productId) } } });

function deliver(request: Request, pushEnv: AdminPushEnv = env, results: string[] = []) {
	return handleStripeWebhook(request, SECRET, (checkout) => recordPaidOrder(pushEnv, checkout, null, store.db), {
		notifyAdmins: async (order) => {
			const result = await enqueueOrderNotification(pushEnv, order.notification, { db: store.db });
			results.push(result.status);
			return result;
		},
	});
}

const count = async () => ({
	orders: (await store.db.select().from(orders)).length,
	notifications: (await store.db.select().from(adminOrderNotifications)).length,
	deliveries: (await store.db.select().from(adminPushDeliveries)).length,
});

async function quietly<T>(run: () => Promise<T>) {
	const errors: string[] = [];
	const original = console.error;
	console.error = (line: string) => { errors.push(line); };
	try {
		return { value: await run(), errors };
	} finally {
		console.error = original;
	}
}

describe("paid order admin alerts", () => {
	test("a paid delivery stores the order and queues one PII-free alert for it", async () => {
		const results: string[] = [];
		expect((await deliver(await signed(paid()), env, results)).status).toBe(200);
		expect(results).toEqual(["queued"]);
		const [order] = await store.db.select().from(orders);
		const [notification] = await store.db.select().from(adminOrderNotifications);
		expect(notification).toMatchObject({ orderId: order.id, artworkTitle: "Study", amountTotal: 125000, currency: "USD" });
		expect(JSON.stringify(notification)).not.toMatch(/Ada|buyer@|Gallery|Recipient/);
		expect(await count()).toEqual({ orders: 1, notifications: 1, deliveries: 1 });
	});

	test("a replayed delivery enqueues again but creates no second order or alert", async () => {
		const results: string[] = [];
		await deliver(await signed(paid()), env, results);
		expect((await deliver(await signed(paid()), env, results)).status).toBe(200);
		expect(results).toEqual(["queued", "duplicate"]);
		expect(await count()).toEqual({ orders: 1, notifications: 1, deliveries: 1 });
	});

	test("checkout succeeds while push is disabled", async () => {
		const results: string[] = [];
		const response = await deliver(await signed(paid()), { ...env, VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "" }, results);
		expect(response.status).toBe(200);
		expect(results).toEqual(["not_configured"]);
		expect(await count()).toEqual({ orders: 1, notifications: 0, deliveries: 0 });
	});

	test("a failed enqueue asks Stripe to retry, and the retry queues the alert without a second order", async () => {
		await store.client.execute("ALTER TABLE admin_push_deliveries RENAME TO admin_push_deliveries_offline");
		const first = await quietly(async () => deliver(await signed(paid())));
		expect(first.value.status).toBe(500);
		expect(first.errors.join("\n")).toContain("admin order notification could not be queued");
		for (const detail of ["buyer@example.com", "Ada Buyer", "Gallery"]) expect(first.errors.join("\n")).not.toContain(detail);
		expect((await store.db.select().from(orders))).toHaveLength(1);
		await store.client.execute("ALTER TABLE admin_push_deliveries_offline RENAME TO admin_push_deliveries");
		const results: string[] = [];
		expect((await deliver(await signed(paid()), env, results)).status).toBe(200);
		expect(results).toEqual(["queued"]);
		expect(await count()).toEqual({ orders: 1, notifications: 1, deliveries: 1 });
	});

	test("an invalid alert is a retryable webhook failure after the order is stored", async () => {
		const request = await signed(paid());
		const response = await quietly(() => handleStripeWebhook(request, SECRET, (checkout) => recordPaidOrder(env, checkout, null, store.db), {
			notifyAdmins: async () => ({ status: "invalid", error: "Invalid order ID" }),
		}));
		expect(response.value.status).toBe(500);
		expect((await store.db.select().from(orders))).toHaveLength(1);
	});

	test("unsigned and unpaid events never enqueue", async () => {
		const results: string[] = [];
		const unsigned = new Request("https://eonmun.test/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "t=1,v1=bad" }, body: JSON.stringify(paid()) });
		expect((await deliver(unsigned, env, results)).status).toBe(400);
		const unpaid = paidCheckoutEvent({ session: { payment_status: "unpaid", metadata: { artworkSlug: "study", productId: String(productId) } } });
		expect((await deliver(await signed(unpaid), env, results)).status).toBe(200);
		expect(results).toEqual([]);
		expect(await count()).toEqual({ orders: 0, notifications: 0, deliveries: 0 });
	});
});
