import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { adminOrderNotifications, adminPushDeliveries, adminPushSubscriptions } from "../src/db";
import { upsertAdminPushSubscription } from "../src/db/admin-push";
import { dispatchAdminPush, enqueueOrderNotification, MAX_ATTEMPTS, type AdminPushEnv } from "../src/lib/push/dispatch";
import { browserKeys, createMigratedDb, decodeJwtClaims, decryptPush, pushServer, vapidKeys } from "./helpers/push";

let store: Awaited<ReturnType<typeof createMigratedDb>>;
let env: AdminPushEnv;
const admin = { id: "google-admin", email: "admin@example.com" };
const order = { orderId: "ord_123", artworkTitle: "Camelia", amountTotal: 125000, currency: "usd" };
const t0 = Date.UTC(2026, 9, 5, 12);

beforeEach(async () => {
	store = await createMigratedDb();
	env = { TURSO_DATABASE_URL: "https://unused.test", ADMIN_EMAILS: "Admin@example.com,other@example.com", ...await vapidKeys() };
});
afterEach(() => store.close());

async function enroll(owner = admin, endpoint = "https://web.push.apple.com/device-1", at = t0 - 60_000) {
	const keys = await browserKeys();
	await upsertAdminPushSubscription(env, owner, { endpoint, p256dh: keys.p256dh, auth: keys.authText }, env.VAPID_PUBLIC_KEY!, "iPhone · Safari", new Date(at), store.db);
	return keys;
}

const deliveries = () => store.db.select().from(adminPushDeliveries).orderBy(adminPushDeliveries.id);
const dispatch = (fetchImpl: typeof fetch, at: number, orderId?: string) => dispatchAdminPush(env, { db: store.db, fetchImpl, now: () => at, orderId });

describe("enqueueOrderNotification", () => {
	test("does nothing when push is not configured", async () => {
		await enroll();
		const result = await enqueueOrderNotification({ ...env, VAPID_PRIVATE_KEY: "" }, order, { db: store.db, now: new Date(t0) });
		expect(result).toEqual({ status: "not_configured" });
		expect(await store.db.select().from(adminOrderNotifications)).toEqual([]);
	});

	test("is idempotent per order and never reaches devices enrolled later", async () => {
		await enroll();
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })).toEqual({ status: "queued", recipients: 1 });
		await enroll(admin, "https://fcm.googleapis.com/fcm/send/later", t0 + 5_000);
		// Stripe replays the same paid event an hour later.
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0 + 3_600_000) })).toEqual({ status: "duplicate", recipients: 1 });
		const rows = await deliveries();
		expect(rows).toHaveLength(1);
		expect(rows[0].subscriptionId).toBe(1);
		const [notification] = await store.db.select().from(adminOrderNotifications);
		expect(notification.createdAt.getTime()).toBe(t0);
		expect(notification.currency).toBe("USD");
	});

	test("records an alert with no devices truthfully and skips admins no longer allowlisted", async () => {
		await enroll({ id: "google-former", email: "former@example.com" });
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })).toEqual({ status: "queued", recipients: 0 });
	});

	test("rejects malformed orders without throwing", async () => {
		for (const bad of [{ ...order, orderId: "../x" }, { ...order, amountTotal: 1.5 }, { ...order, currency: "dollars" }, { ...order, artworkTitle: " " }]) {
			expect((await enqueueOrderNotification(env, bad, { db: store.db })).status).toBe("invalid");
		}
	});

	test("reports a storage failure instead of throwing", async () => {
		await store.client.execute("DROP TABLE admin_push_deliveries");
		const result = await enqueueOrderNotification(env, order, { db: store.db });
		expect(result.status).toBe("failed");
	});
});

describe("dispatchAdminPush", () => {
	test("sends an encrypted, signed, PII-free alert once", async () => {
		const keys = await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer();
		expect(await dispatch(server.fetchImpl, t0 + 1000)).toEqual({ claimed: 1, sent: 1, retrying: 0, failed: 0, removed: 0 });
		const [push] = server.calls;
		expect(push.url).toBe("https://web.push.apple.com/device-1");
		expect(push.init.redirect).toBe("manual");
		expect(push.init.signal).toBeInstanceOf(AbortSignal);
		expect(push.headers.get("content-encoding")).toBe("aes128gcm");
		expect(push.headers.get("ttl")).toBe("86400");
		expect(push.headers.get("urgency")).toBe("high");
		expect(push.headers.get("topic")).toMatch(/^[A-Za-z0-9_-]{32}$/);
		expect(decodeJwtClaims(push.headers.get("authorization")!)).toMatchObject({ aud: "https://web.push.apple.com", sub: "https://eonmun.com" });
		expect(await decryptPush(push.body, keys)).toEqual({ title: "Order paid", body: "Camelia · $1,250.00", url: "/admin/orders/ord_123", tag: "order-ord_123" });
		const [row] = await deliveries();
		expect(row).toMatchObject({ status: "sent", attempts: 1, lastStatus: 201, leaseUntil: null });
		expect(await dispatch(server.fetchImpl, t0 + 120_000)).toMatchObject({ claimed: 0 });
		expect(server.calls).toHaveLength(1);
	});

	test("concurrent dispatchers do not send the same delivery twice", async () => {
		await enroll();
		await enroll(admin, "https://fcm.googleapis.com/fcm/send/device-2");
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
			return new Response(null, { status: 201 });
		});
		const results = await Promise.all([dispatch(server.fetchImpl, t0 + 1000), dispatch(server.fetchImpl, t0 + 1000), dispatch(server.fetchImpl, t0 + 1000, order.orderId)]);
		expect(results.reduce((total, result) => total + result.sent, 0)).toBe(2);
		expect(server.calls.map((call) => call.url).sort()).toEqual(["https://fcm.googleapis.com/fcm/send/device-2", "https://web.push.apple.com/device-1"]);
	});

	test("retries transient failures with backoff, honours Retry-After, and gives up after the bound", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer((_, index) => index === 1
			? new Response(null, { status: 429, headers: { "retry-after": "600" } })
			: new Response(null, { status: 503 }));
		let now = t0 + 1000;
		expect(await dispatch(server.fetchImpl, now)).toMatchObject({ retrying: 1 });
		let [row] = await deliveries();
		expect(row).toMatchObject({ status: "pending", attempts: 1, lastStatus: 503, lastError: "HTTP 503", leaseUntil: null });
		expect(row.nextAttemptAt.getTime()).toBe(now + 60_000);
		// Not due yet.
		expect(await dispatch(server.fetchImpl, now + 30_000)).toMatchObject({ claimed: 0 });
		now = row.nextAttemptAt.getTime();
		await dispatch(server.fetchImpl, now);
		[row] = await deliveries();
		expect(row.nextAttemptAt.getTime()).toBe(now + 600_000);
		while (row.status === "pending") {
			await dispatch(server.fetchImpl, row.nextAttemptAt.getTime());
			[row] = await deliveries();
		}
		expect(row).toMatchObject({ status: "failed", attempts: MAX_ATTEMPTS, lastError: "HTTP 503; retries exhausted" });
		expect(server.calls).toHaveLength(MAX_ATTEMPTS);
	});

	test("treats a network error or timeout as retryable", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const fetchImpl = (async () => { throw new DOMException("timed out", "TimeoutError"); }) as unknown as typeof fetch;
		expect(await dispatch(fetchImpl, t0 + 1000)).toMatchObject({ retrying: 1 });
		expect((await deliveries())[0]).toMatchObject({ status: "pending", lastError: "Timed out" });
	});

	test("removes an expired subscription and keeps the delivery as history", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		await enqueueOrderNotification(env, { ...order, orderId: "ord_456" }, { db: store.db, now: new Date(t0) });
		const server = pushServer(() => new Response("gone", { status: 410 }));
		expect(await dispatch(server.fetchImpl, t0 + 1000, order.orderId)).toMatchObject({ failed: 1, removed: 1 });
		expect(await store.db.select().from(adminPushSubscriptions)).toEqual([]);
		const rows = await deliveries();
		expect(rows.map((row) => [row.status, row.subscriptionId])).toEqual([["expired", null], ["expired", null]]);
		expect(await dispatch(server.fetchImpl, t0 + 120_000)).toMatchObject({ claimed: 0 });
		expect(server.calls).toHaveLength(1);
	});

	test("does not send to an admin whose access was revoked after the sale", async () => {
		await enroll({ id: "google-other", email: "other@example.com" });
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		env.ADMIN_EMAILS = "admin@example.com";
		const server = pushServer();
		expect(await dispatch(server.fetchImpl, t0 + 1000)).toMatchObject({ failed: 1, removed: 1 });
		expect(server.calls).toEqual([]);
		expect((await deliveries())[0]).toMatchObject({ status: "revoked", subscriptionId: null });
		expect(await store.db.select().from(adminPushSubscriptions)).toEqual([]);
	});

	test("an empty allowlist pauses delivery instead of revoking every device", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer();
		expect(await dispatchAdminPush({ ...env, ADMIN_EMAILS: "" }, { db: store.db, fetchImpl: server.fetchImpl, now: () => t0 })).toMatchObject({ claimed: 0 });
		expect(await store.db.select().from(adminPushSubscriptions)).toHaveLength(1);
	});

	test("a mismatched key pair leaves alerts queued instead of failing every run", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer();
		const broken = { ...env, VAPID_PRIVATE_KEY: (await vapidKeys()).VAPID_PRIVATE_KEY };
		expect(await dispatchAdminPush(broken, { db: store.db, fetchImpl: server.fetchImpl, now: () => t0 })).toMatchObject({ claimed: 0 });
		expect((await deliveries())[0]).toMatchObject({ status: "pending", attempts: 0 });
	});

	test("drops devices enrolled under a rotated VAPID key", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		Object.assign(env, await vapidKeys());
		const server = pushServer();
		expect(await dispatch(server.fetchImpl, t0 + 1000)).toMatchObject({ failed: 1, removed: 1 });
		expect(server.calls).toEqual([]);
		expect((await deliveries())[0].status).toBe("stale");
	});

	test("does not deliver alerts older than a day", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer();
		await dispatch(server.fetchImpl, t0 + 25 * 3_600_000);
		expect(server.calls).toEqual([]);
		expect((await deliveries())[0]).toMatchObject({ status: "failed", lastError: "Expired before delivery" });
	});

	test("never fetches a stored endpoint outside the push-service allowlist", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		await store.db.update(adminPushSubscriptions).set({ endpoint: "https://169.254.169.254/latest" }).where(eq(adminPushSubscriptions.id, 1));
		const server = pushServer();
		await dispatch(server.fetchImpl, t0 + 1000);
		expect(server.calls).toEqual([]);
		expect((await deliveries())[0]).toMatchObject({ status: "failed", lastError: "Invalid subscription" });
	});

	test("treats a redirect as a permanent failure", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer(() => new Response(null, { status: 302, headers: { location: "https://evil.test/" } }));
		await dispatch(server.fetchImpl, t0 + 1000);
		expect(server.calls).toHaveLength(1);
		expect((await deliveries())[0]).toMatchObject({ status: "failed", lastError: "Unexpected redirect (HTTP 302)" });
	});
});
