import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../public/push-sw.js", import.meta.url), "utf8");

type Listener = (event: Record<string, unknown>) => void;

function loadWorker(windows: { url: string; focus: () => Promise<unknown> }[] = [], respond: (method: string) => Response = () => new Response(null, { status: 201 })) {
	const listeners = new Map<string, Listener>();
	const shown: { title: string; options: Record<string, unknown> }[] = [];
	const opened: string[] = [];
	const requests: string[] = [];
	const self = {
		location: new URL("https://eonmun.test/push-sw.js"),
		addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
		skipWaiting: () => undefined,
		registration: { showNotification: async (title: string, options: Record<string, unknown>) => { shown.push({ title, options }); } },
		clients: { claim: async () => undefined, matchAll: async () => windows, openWindow: async (url: string) => { opened.push(url); } },
	};
	new Function("self", "fetch", source)(self, async (url: string, init: RequestInit) => {
		requests.push(`${init.method} ${url} ${init.body}`);
		return respond(init.method!);
	});
	const fire = async (type: string, event: Record<string, unknown>) => {
		let pending: Promise<unknown> = Promise.resolve();
		listeners.get(type)!({ ...event, waitUntil: (promise: Promise<unknown>) => { pending = promise; } });
		await pending;
	};
	return { listeners, shown, opened, requests, fire };
}

const pushEvent = (data: unknown) => ({ data: { json: () => { if (typeof data === "string") throw new SyntaxError("bad"); return data; } } });

describe("push service worker", () => {
	test("has no fetch handler, so it cannot cache private pages or checkout", () => {
		const worker = loadWorker();
		expect(worker.listeners.has("fetch")).toBe(false);
		expect(source).not.toMatch(/caches\.|addEventListener\(["']fetch/);
	});

	test("shows a visible notification for every push, even an unreadable one", async () => {
		const worker = loadWorker();
		await worker.fire("push", pushEvent({ title: "Order paid", body: "Camelia · $1,250.00", url: "/admin/orders/ord_1", tag: "order-ord_1" }));
		await worker.fire("push", pushEvent("not json"));
		expect(worker.shown).toHaveLength(2);
		expect(worker.shown[0]).toMatchObject({ title: "Order paid", options: { body: "Camelia · $1,250.00", tag: "order-ord_1", data: { url: "https://eonmun.test/admin/orders/ord_1" } } });
		expect(worker.shown[1]).toMatchObject({ title: "EONMUN", options: { data: { url: "https://eonmun.test/admin/notifications" } } });
	});

	test("only opens this site's admin pages", async () => {
		const worker = loadWorker();
		for (const url of ["https://evil.test/admin/x", "//evil.test/admin", "javascript:alert(1)", "/checkout", "/artworks/x"]) {
			await worker.fire("push", pushEvent({ title: "x", url }));
		}
		expect(worker.shown.map((entry) => (entry.options.data as { url: string }).url)).toEqual(Array(5).fill("https://eonmun.test/admin/notifications"));
	});

	test("focuses an open order window or opens a new one", async () => {
		const focused: string[] = [];
		const target = "https://eonmun.test/admin/orders/ord_1";
		const worker = loadWorker([{ url: target, focus: async () => focused.push(target) }]);
		const click = (url: string) => ({ notification: { data: { url }, close: () => undefined } });
		await worker.fire("notificationclick", click(target));
		await worker.fire("notificationclick", click("https://eonmun.test/admin/orders/ord_2"));
		await worker.fire("notificationclick", click("https://evil.test/"));
		expect(focused).toEqual([target]);
		expect(worker.opened).toEqual(["https://eonmun.test/admin/orders/ord_2", "https://eonmun.test/admin/notifications"]);
	});

	test("replaces a rotated subscription only after the new one is stored", async () => {
		const subscription = (endpoint: string) => ({ endpoint, options: { applicationServerKey: new ArrayBuffer(65) }, toJSON: () => ({ endpoint }) });
		const change = (oldEndpoint: string, newEndpoint: string) => ({ oldSubscription: subscription(oldEndpoint), newSubscription: subscription(newEndpoint) });
		const old = "https://web.push.apple.com/old";

		const rotated = loadWorker();
		await rotated.fire("pushsubscriptionchange", change(old, "https://web.push.apple.com/new"));
		expect(rotated.requests).toEqual([
			'POST /api/admin/push/subscription {"endpoint":"https://web.push.apple.com/new"}',
			`DELETE /api/admin/push/subscription {"endpoint":"${old}"}`,
		]);

		const refreshed = loadWorker();
		await refreshed.fire("pushsubscriptionchange", change(old, old));
		expect(refreshed.requests).toHaveLength(1);

		const rejected = loadWorker([], () => new Response(null, { status: 401 }));
		await rejected.fire("pushsubscriptionchange", change(old, "https://web.push.apple.com/new"));
		expect(rejected.requests.map((entry) => entry.split(" ")[0])).toEqual(["POST"]);
	});
});
