import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { adminPushSubscriptions } from "../src/db";
import { upsertAdminPushSubscription } from "../src/db/admin-push";
import { sendTest, subscribe, subscriptionStatus, unsubscribe } from "../src/lib/push/api";
import type { AdminPushEnv } from "../src/lib/push/dispatch";
import { parsePushEndpoint } from "../src/lib/push/subscription-input";
import { adminCookies, authTestSecret } from "./helpers/auth";
import { browserKeys, createMigratedDb, decryptPush, pushServer, vapidKeys } from "./helpers/push";

// The shared auth helper issues the non-`__Secure-` cookie names Better Auth uses over HTTP.
const origin = "http://127.0.0.1:4321";
let store: Awaited<ReturnType<typeof createMigratedDb>>;
let env: AdminPushEnv & Record<string, unknown>;

beforeEach(async () => {
	store = await createMigratedDb();
	env = {
		AUTH_SECRET: authTestSecret, AUTH_GOOGLE_ID: "client", AUTH_GOOGLE_SECRET: "secret",
		ADMIN_EMAILS: "admin@example.com,other@example.com", TURSO_DATABASE_URL: "https://unused.test", ...await vapidKeys(),
	};
});
afterEach(() => store.close());

async function cookieFor(email: string, googleId: string) {
	return (await adminCookies(origin, email, googleId)).map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

const admin = () => cookieFor("admin@example.com", "google-admin");
const other = () => cookieFor("other@example.com", "google-other");

function request(path: string, body: unknown, options: { cookie?: string; origin?: string | null; method?: string; contentType?: string; raw?: string } = {}) {
	const headers = new Headers({ "content-type": options.contentType ?? "application/json", "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1" });
	if (options.origin !== null) headers.set("origin", options.origin ?? origin);
	if (options.cookie) headers.set("cookie", options.cookie);
	return new Request(`${origin}${path}`, { method: options.method ?? "POST", headers, body: options.raw ?? JSON.stringify(body) });
}

async function subscription(endpoint = "https://web.push.apple.com/QGuJ1") {
	const keys = await browserKeys();
	return { keys, body: { endpoint, expirationTime: null, keys: { p256dh: keys.p256dh, auth: keys.authText } } };
}

const db = () => ({ db: store.db });

describe("admin push API guards", () => {
	test("rejects cross-origin, missing-origin, and signed-out requests", async () => {
		const { body } = await subscription();
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie: await admin(), origin: "http://evil.test" }), env, db())).status).toBe(403);
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie: await admin(), origin: null }), env, db())).status).toBe(403);
		expect((await subscribe(request("/api/admin/push/subscription", body), env, db())).status).toBe(401);
		expect(await store.db.select().from(adminPushSubscriptions)).toEqual([]);
	});

	test("rejects an admin removed from the allowlist", async () => {
		const { body } = await subscription();
		const response = await subscribe(request("/api/admin/push/subscription", body, { cookie: await cookieFor("former@example.com", "google-former") }), env, db());
		expect(response.status).toBe(401);
	});

	test("reports an unconfigured server without storing anything", async () => {
		const { body } = await subscription();
		const response = await subscribe(request("/api/admin/push/subscription", body, { cookie: await admin() }), { ...env, VAPID_PUBLIC_KEY: "" }, db());
		expect(response.status).toBe(503);
	});

	test("bounds and types the request body", async () => {
		const cookie = await admin();
		expect((await subscribe(request("/api/admin/push/subscription", null, { cookie, raw: `{"endpoint":"${"a".repeat(5000)}"}` }), env, db())).status).toBe(413);
		expect((await subscribe(request("/api/admin/push/subscription", null, { cookie, contentType: "text/plain" }), env, db())).status).toBe(400);
		expect((await subscribe(request("/api/admin/push/subscription", null, { cookie, raw: "{" }), env, db())).status).toBe(400);
	});
});

describe("subscription validation", () => {
	test("accepts only HTTPS endpoints on known push services", () => {
		for (const endpoint of [
			"https://web.push.apple.com/QGuJ1", "https://fcm.googleapis.com/fcm/send/abc", "https://updates.push.services.mozilla.com/wpush/v2/x", "https://wns2-par02p.notify.windows.com/w/?token=x",
		]) expect(parsePushEndpoint(endpoint).href).toBe(endpoint);
		for (const endpoint of [
			"http://web.push.apple.com/x", "https://push.apple.com.evil.test/x", "https://evilpush.apple.com/x", "https://push.apple.com/x",
			"https://user:pass@web.push.apple.com/x", "https://web.push.apple.com:8443/x", "https://127.0.0.1/x", "https://localhost/x",
			"https://fcm.googleapis.com.evil.test/x", "javascript:alert(1)", "", 42,
		]) expect(() => parsePushEndpoint(endpoint)).toThrow();
	});

	test("rejects keys that are not a P-256 point and a 16-byte secret", async () => {
		const cookie = await admin();
		const { body } = await subscription();
		for (const keys of [{ ...body.keys, p256dh: "BAAA" }, { ...body.keys, p256dh: `B${"A".repeat(86)}` }, { ...body.keys, auth: "short" }, {}]) {
			const response = await subscribe(request("/api/admin/push/subscription", { ...body, keys }, { cookie }), env, db());
			expect(response.status).toBe(400);
		}
		const ssrf = await subscribe(request("/api/admin/push/subscription", { ...body, endpoint: "https://169.254.169.254/latest/meta-data" }, { cookie }), env, db());
		expect(ssrf.status).toBe(400);
	});
});

describe("device ownership", () => {
	test("admins can test an enrolled device by ID with shared rate limits and recipient access checks", async () => {
		const { body, keys } = await subscription();
		await subscribe(request("/api/admin/push/subscription", body, { cookie: await other() }), env, db());
		const [device] = await store.db.select().from(adminPushSubscriptions);
		const server = pushServer();
		const options = { db: store.db, fetchImpl: server.fetchImpl };
		const cookie = await admin();
		expect((await sendTest(request("/api/admin/push/test", { deviceId: device.id }), env, options)).status).toBe(401);
		expect((await sendTest(request("/api/admin/push/test", { deviceId: device.id }, { cookie, origin: "https://evil.test" }), env, options)).status).toBe(403);
		expect((await sendTest(request("/api/admin/push/test", { deviceId: device.id }, { cookie }), env, options)).status).toBe(200);
		expect(await decryptPush(server.calls[0].body, keys)).toMatchObject({ title: "EONMUN test notification" });
		expect((await sendTest(request("/api/admin/push/test", { endpoint: body.endpoint }, { cookie: await other() }), env, options)).status).toBe(429);
		expect((await sendTest(request("/api/admin/push/test", { deviceId: device.id }, { cookie }), { ...env, ADMIN_EMAILS: "admin@example.com" }, options)).status).toBe(404);
		expect((await sendTest(request("/api/admin/push/test", { deviceId: -1 }, { cookie }), env, options)).status).toBe(400);
		expect(server.calls).toHaveLength(1);
	});

	test("registers a device to the signed-in admin and reports its status", async () => {
		const cookie = await admin();
		const { body } = await subscription();
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db())).status).toBe(201);
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db())).status).toBe(200);
		const [row] = await store.db.select().from(adminPushSubscriptions);
		expect(row).toMatchObject({ ownerId: "google-admin", ownerEmail: "admin@example.com", deviceLabel: "iPhone · Safari", vapidPublicKey: env.VAPID_PUBLIC_KEY });
		const status = await subscriptionStatus(request("/api/admin/push/status", { endpoint: body.endpoint }, { cookie }), env, db());
		expect(await status.json()).toEqual({ registered: true });
		const otherStatus = await subscriptionStatus(request("/api/admin/push/status", { endpoint: body.endpoint }, { cookie: await other() }), env, db());
		expect(await otherStatus.json()).toEqual({ registered: false });
	});

	test("another admin cannot remove a device or test it using a private endpoint", async () => {
		const { body } = await subscription();
		await subscribe(request("/api/admin/push/subscription", body, { cookie: await admin() }), env, db());
		const intruder = await other();
		const server = pushServer();
		expect((await unsubscribe(request("/api/admin/push/subscription", { endpoint: body.endpoint }, { cookie: intruder, method: "DELETE" }), env, db())).status).toBe(404);
		expect((await unsubscribe(request("/api/admin/push/subscription", { id: 1 }, { cookie: intruder, method: "DELETE" }), env, db())).status).toBe(404);
		expect((await sendTest(request("/api/admin/push/test", { endpoint: body.endpoint }, { cookie: intruder }), env, { db: store.db, fetchImpl: server.fetchImpl })).status).toBe(404);
		expect(server.calls).toEqual([]);
		expect(await store.db.select().from(adminPushSubscriptions)).toHaveLength(1);
		expect((await unsubscribe(request("/api/admin/push/subscription", { id: 1 }, { cookie: await admin(), method: "DELETE" }), env, db())).status).toBe(200);
		expect(await store.db.select().from(adminPushSubscriptions)).toEqual([]);
	});

	test("the same browser re-enabled by another admin becomes a fresh enrolment", async () => {
		const { body } = await subscription();
		await subscribe(request("/api/admin/push/subscription", body, { cookie: await admin() }), env, db());
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie: await other() }), env, db())).status).toBe(201);
		const rows = await store.db.select().from(adminPushSubscriptions);
		expect(rows.map((row) => [row.id, row.ownerId])).toEqual([[2, "google-other"]]);
	});

	test("sends a fixed test message to the caller's device at most once a minute", async () => {
		const cookie = await admin();
		const { body, keys } = await subscription();
		await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db());
		const server = pushServer();
		const first = await sendTest(request("/api/admin/push/test", { endpoint: body.endpoint, title: "Injected" }, { cookie }), env, { db: store.db, fetchImpl: server.fetchImpl });
		expect(first.status).toBe(200);
		expect(await decryptPush(server.calls[0].body, keys)).toMatchObject({ title: "EONMUN test notification", url: "/admin/settings#notifications" });
		const second = await sendTest(request("/api/admin/push/test", { endpoint: body.endpoint }, { cookie }), env, { db: store.db, fetchImpl: server.fetchImpl });
		expect(second.status).toBe(429);
		expect(server.calls).toHaveLength(1);
	});

	test("an expired device found by a test send is removed", async () => {
		const cookie = await admin();
		const { body } = await subscription();
		await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db());
		const server = pushServer(() => new Response(null, { status: 410 }));
		const response = await sendTest(request("/api/admin/push/test", { endpoint: body.endpoint }, { cookie }), env, { db: store.db, fetchImpl: server.fetchImpl });
		expect(response.status).toBe(502);
		expect(await store.db.select().from(adminPushSubscriptions)).toEqual([]);
	});

	test("an admin can remove a device while push keys are not configured", async () => {
		const cookie = await admin();
		const { body } = await subscription();
		await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db());
		const unconfigured = { ...env, VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "" };
		expect((await unsubscribe(request("/api/admin/push/subscription", { endpoint: body.endpoint }, { cookie: await other(), method: "DELETE" }), unconfigured, db())).status).toBe(404);
		expect((await unsubscribe(request("/api/admin/push/subscription", { endpoint: body.endpoint }, { cookie, method: "DELETE" }), unconfigured, db())).status).toBe(200);
		expect(await store.db.select().from(adminPushSubscriptions)).toEqual([]);
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie }), unconfigured, db())).status).toBe(503);
	});

	test("concurrent enrolments cannot exceed the device limit", async () => {
		const owner = { id: "google-admin", email: "admin@example.com" };
		const enrol = async (endpoint: string) => {
			const { body } = await subscription(endpoint);
			return upsertAdminPushSubscription(env, owner, { endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth }, env.VAPID_PUBLIC_KEY!, null, new Date(), store.db);
		};
		for (let index = 0; index < 8; index++) await enrol(`https://fcm.googleapis.com/fcm/send/existing-${index}`);
		const results = await Promise.all(Array.from({ length: 6 }, (_, index) => enrol(`https://fcm.googleapis.com/fcm/send/race-${index}`)));
		expect(results.filter((result) => result === "created")).toHaveLength(2);
		expect(results.filter((result) => result === "limit")).toHaveLength(4);
		expect(await store.db.select().from(adminPushSubscriptions)).toHaveLength(10);
	});

	test("a full admin cannot take over another admin's device", async () => {
		const { body } = await subscription("https://web.push.apple.com/shared");
		await subscribe(request("/api/admin/push/subscription", body, { cookie: await other() }), env, db());
		const cookie = await admin();
		for (let index = 0; index < 10; index++) {
			await subscribe(request("/api/admin/push/subscription", (await subscription(`https://fcm.googleapis.com/fcm/send/full-${index}`)).body, { cookie }), env, db());
		}
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db())).status).toBe(409);
		const shared = (await store.db.select().from(adminPushSubscriptions)).filter((row) => row.endpoint === body.endpoint);
		expect(shared.map((row) => row.ownerId)).toEqual(["google-other"]);
	});

	test("limits devices per admin", async () => {
		const cookie = await admin();
		for (let index = 0; index < 10; index++) {
			const { body } = await subscription(`https://fcm.googleapis.com/fcm/send/device-${index}`);
			expect((await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db())).status).toBe(201);
		}
		const { body } = await subscription("https://fcm.googleapis.com/fcm/send/device-11");
		expect((await subscribe(request("/api/admin/push/subscription", body, { cookie }), env, db())).status).toBe(409);
	});
});
