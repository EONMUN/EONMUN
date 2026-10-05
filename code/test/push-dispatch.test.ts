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

	test("replays never add recipients, even after the allowlist changes", async () => {
		await enroll({ id: "google-later", email: "later@example.com" });
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })).toEqual({ status: "queued", recipients: 0 });
		env.ADMIN_EMAILS += ",later@example.com";
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0 + 60_000) })).toEqual({ status: "duplicate", recipients: 0 });
	});

	test("a duplicate call in the same millisecond keeps the first snapshot and is not reported as created", async () => {
		await enroll();
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })).toEqual({ status: "queued", recipients: 1 });
		// Between the calls: a previously excluded admin is allowlisted and a device with an eligible enrolment time appears.
		await enroll({ id: "google-later", email: "later@example.com" }, "https://fcm.googleapis.com/fcm/send/later", t0 - 30_000);
		env.ADMIN_EMAILS += ",later@example.com";
		await enroll(admin, "https://updates.push.services.mozilla.com/wpush/v2/new", t0 - 1);
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })).toEqual({ status: "duplicate", recipients: 1 });
		expect((await deliveries()).map((row) => row.subscriptionId)).toEqual([1]);
	});

	test("concurrent calls in the same millisecond create one alert and one recipient set", async () => {
		await enroll();
		await enroll({ id: "google-other", email: "other@example.com" }, "https://fcm.googleapis.com/fcm/send/other");
		const error = console.error;
		console.error = () => undefined;
		const results = await Promise.all(Array.from({ length: 4 }, () => enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })))
			.finally(() => { console.error = error; });
		// Exactly one call owns the alert. A losing call either sees the conflict or
		// meets the write lock and reports a retryable failure; none reports creation.
		expect(results.filter((result) => result.status === "queued")).toEqual([{ status: "queued", recipients: 2 }]);
		for (const result of results) expect(["queued", "duplicate", "failed"]).toContain(result.status);
		expect(await deliveries()).toHaveLength(2);
		expect(await store.db.select().from(adminOrderNotifications)).toHaveLength(1);
		// A locked caller's Stripe retry is the same-millisecond duplicate case above.
	});

	test("records an alert with no devices truthfully and skips admins no longer allowlisted", async () => {
		await enroll({ id: "google-former", email: "former@example.com" });
		expect(await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) })).toEqual({ status: "queued", recipients: 0 });
	});

	test("rejects malformed orders without throwing", async () => {
		for (const bad of [{ ...order, orderId: "../x" }, { ...order, amountTotal: 1.5 }, { ...order, currency: "dollars" }, { ...order, artworkTitle: 5 as unknown as string }]) {
			expect((await enqueueOrderNotification(env, bad, { db: store.db })).status).toBe("invalid");
		}
	});

	test("a stored order with a blank title still gets an alert", async () => {
		expect((await enqueueOrderNotification(env, { ...order, artworkTitle: " " }, { db: store.db })).status).toBe("queued");
		expect((await store.db.select().from(adminOrderNotifications))[0].artworkTitle).toBe("Artwork");
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

	test("closes a delivery that already used its attempts without sending again", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		// A run sent the sixth attempt, then died before recording it; its lease has expired.
		await store.db.update(adminPushDeliveries).set({ attempts: MAX_ATTEMPTS, leaseUntil: new Date(t0) });
		const server = pushServer();
		expect(await dispatch(server.fetchImpl, t0 + 60_000)).toMatchObject({ claimed: 1, sent: 0, failed: 1 });
		expect(server.calls).toEqual([]);
		expect((await deliveries())[0]).toMatchObject({ status: "failed", lastError: "Retry budget exhausted", leaseUntil: null });
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

	test("keeps a device re-enrolled while its old registration was being rejected", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		await enqueueOrderNotification(env, { ...order, orderId: "ord_456" }, { db: store.db, now: new Date(t0) });
		const server = pushServer(async () => {
			// The browser refreshes its keys on the same endpoint mid-send.
			await enroll(admin, "https://web.push.apple.com/device-1", t0 + 1500);
			return new Response(null, { status: 410 });
		});
		expect(await dispatch(server.fetchImpl, t0 + 2000, order.orderId)).toMatchObject({ failed: 1 });
		expect(await store.db.select().from(adminPushSubscriptions)).toHaveLength(1);
		const rows = await deliveries();
		expect(rows.map((row) => [row.orderId, row.status, row.subscriptionId])).toEqual([["ord_123", "expired", 1], ["ord_456", "pending", 1]]);
	});

	test("a run whose lease was taken over removes and records nothing", async () => {
		await enroll();
		await enqueueOrderNotification(env, order, { db: store.db, now: new Date(t0) });
		const server = pushServer(async () => {
			await store.db.update(adminPushDeliveries).set({ leaseUntil: new Date(t0 + 999_999) });
			return new Response(null, { status: 410 });
		});
		await dispatch(server.fetchImpl, t0 + 1000);
		expect(await store.db.select().from(adminPushSubscriptions)).toHaveLength(1);
		expect((await deliveries())[0]).toMatchObject({ status: "pending", subscriptionId: 1, leaseUntil: new Date(t0 + 999_999) });
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
