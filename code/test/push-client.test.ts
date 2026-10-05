import { describe, expect, test } from "bun:test";
import { Window } from "happy-dom";
import { attachPushSettings, type PushSettingsEnvironment } from "../src/lib/push-client";

const serverKey = `B${"A".repeat(86)}`;
const decodedKey = Uint8Array.from(atob(serverKey.replace(/-/g, "+").replace(/_/g, "/").padEnd(88, "=")), (c) => c.charCodeAt(0));
const markup = `<div data-push-settings data-push-public-key="${serverKey}">
	<p data-push-status></p>
	<button data-push-enable hidden disabled>Enable notifications</button>
	<button data-push-disable hidden>Off</button>
	<div data-push-guide="install" hidden></div><div data-push-guide="denied" hidden></div>
	<ul><li><button data-push-remove-id="7">Remove</button></li></ul>
</div>`;

const iPhone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const chrome = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

type Options = {
	userAgent?: string; push?: boolean; standalone?: boolean; permission?: NotificationPermission;
	existing?: { key: Uint8Array } | null; registered?: boolean; subscribe?: () => Promise<unknown>; publicKey?: string;
};

function mount(options: Options = {}) {
	const window = new Window({ url: "https://eonmun.test/admin/notifications" });
	window.document.body.innerHTML = markup;
	const root = window.document.querySelector("[data-push-settings]") as unknown as HTMLElement;
	if (options.publicKey !== undefined) root.dataset.pushPublicKey = options.publicKey;
	const log: string[] = [];
	let inClick = false;
	const notification = { permission: options.permission ?? "default" as NotificationPermission };
	const endpoint = "https://web.push.apple.com/device";
	const makeSubscription = (key: Uint8Array) => ({
		endpoint,
		options: { applicationServerKey: key.buffer },
		toJSON: () => ({ endpoint, keys: { p256dh: "p", auth: "a" } }),
		unsubscribe: async () => { log.push("unsubscribe"); current = null; return true; },
	});
	let current = options.existing ? makeSubscription(options.existing.key) : null;
	const pushManager = {
		getSubscription: async () => current,
		subscribe: (init: PushSubscriptionOptionsInit) => {
			log.push(inClick ? "subscribe:in-gesture" : "subscribe:outside-gesture");
			expect(init.userVisibleOnly).toBe(true);
			return (options.subscribe?.() ?? Promise.resolve()).then(() => {
				notification.permission = "granted";
				current = makeSubscription(decodedKey);
				return current;
			});
		},
	};
	const registration = { pushManager };
	const navigator = {
		userAgent: options.userAgent ?? chrome, platform: "Linux x86_64", maxTouchPoints: 0, standalone: options.standalone,
		...(options.push === false ? {} : { serviceWorker: {
			register: async (url: string, init: RegistrationOptions) => { log.push(`register:${url}:${init.scope}`); return registration; },
			ready: Promise.resolve(registration),
		} }),
	} as unknown as Navigator;
	const fetchImpl = (async (url: string, init: RequestInit) => {
		log.push(`${init.method} ${url} ${init.body}`);
		if (url === "/api/admin/push/status") return Response.json({ registered: options.registered ?? false });
		return Response.json({ ok: true }, { status: init.method === "POST" && url.endsWith("subscription") ? 201 : 200 });
	}) as unknown as typeof fetch;
	const environment: PushSettingsEnvironment = {
		navigator,
		window: {
			matchMedia: () => ({ matches: options.standalone === true }),
			...(options.push === false ? {} : { PushManager: function PushManager() {}, Notification: notification }),
		},
		fetchImpl,
	};
	const { ready } = attachPushSettings(root, environment);
	const button = (name: string) => root.querySelector(`[data-push-${name}]`) as unknown as HTMLButtonElement;
	const tap = (name: string) => { inClick = true; button(name).click(); inClick = false; };
	const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
	return { root, ready, log, button, tap, settle, state: () => root.dataset.pushState, status: () => root.querySelector("[data-push-status]")!.textContent };
}

describe("admin push opt-in", () => {
	test("calls subscribe synchronously inside the tap and registers the device", async () => {
		const page = mount();
		expect(page.button("enable").disabled).toBe(true);
		await page.ready;
		expect(page.state()).toBe("disabled");
		expect(page.button("enable").hidden).toBe(false);
		expect(page.log).toEqual(["register:/push-sw.js:/admin/"]);
		page.tap("enable");
		// Recorded before click() returned: no await ran ahead of subscribe().
		expect(page.log).toContain("subscribe:in-gesture");
		expect(page.button("enable").disabled).toBe(true);
		await page.settle();
		expect(page.log.at(-1)).toBe('POST /api/admin/push/subscription {"endpoint":"https://web.push.apple.com/device","keys":{"p256dh":"p","auth":"a"}}');
		expect(page.state()).toBe("enabled");
		expect(page.button("disable").hidden).toBe(false);
	});

	test("never asks for permission without a tap", async () => {
		const page = mount();
		await page.ready;
		await page.settle();
		expect(page.log.some((entry) => entry.startsWith("subscribe"))).toBe(false);
	});

	test("shows Home Screen guidance in an iPhone Safari tab without push support", async () => {
		const page = mount({ userAgent: iPhone, push: false });
		await page.ready;
		expect(page.state()).toBe("install");
		expect((page.root.querySelector('[data-push-guide="install"]') as unknown as HTMLElement).hidden).toBe(false);
		expect(page.button("enable").hidden).toBe(true);
	});

	test("reports unsupported browsers that are not iOS", async () => {
		const page = mount({ push: false });
		await page.ready;
		expect(page.state()).toBe("unsupported");
	});

	test("reports a missing server key", async () => {
		const page = mount({ publicKey: "" });
		await page.ready;
		expect(page.state()).toBe("not-configured");
		expect(page.log).toEqual([]);
	});

	test("shows settings guidance when permission is denied", async () => {
		const page = mount({ permission: "denied" });
		await page.ready;
		expect(page.state()).toBe("denied");
		expect(page.button("enable").hidden).toBe(true);
		expect((page.root.querySelector('[data-push-guide="denied"]') as unknown as HTMLElement).hidden).toBe(false);
	});

	test("moves to the denied state when the prompt is refused", async () => {
		let deny!: () => void;
		const page = mount({ subscribe: () => new Promise((_, reject) => { deny = () => reject(new DOMException("denied", "NotAllowedError")); }) });
		await page.ready;
		page.tap("enable");
		deny();
		await page.settle();
		expect(page.state()).toBe("disabled");
		expect(page.status()).toContain("not enabled");
	});

	test("shows a registered device as enabled and turns it off", async () => {
		const page = mount({ existing: { key: decodedKey }, registered: true, permission: "granted" });
		await page.ready;
		expect(page.state()).toBe("enabled");
		page.tap("disable");
		await page.settle();
		await page.settle();
		expect(page.log).toContain('DELETE /api/admin/push/subscription {"endpoint":"https://web.push.apple.com/device"}');
		expect(page.log.at(-1)).toBe("unsubscribe");
		expect(page.state()).toBe("disabled");
	});

	test("does not silently claim a browser subscription the server does not know", async () => {
		const page = mount({ existing: { key: decodedKey }, registered: false, permission: "granted" });
		await page.ready;
		expect(page.state()).toBe("disabled");
		expect(page.log.filter((entry) => entry.startsWith("POST /api/admin/push/subscription"))).toEqual([]);
	});

	test("drops a subscription made with an old server key", async () => {
		const page = mount({ existing: { key: new Uint8Array(65).fill(4) }, permission: "granted" });
		await page.ready;
		expect(page.log).toContain("unsubscribe");
		expect(page.state()).toBe("disabled");
	});
});
