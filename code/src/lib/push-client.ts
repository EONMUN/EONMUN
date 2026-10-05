// Browser side of admin push opt-in. Kept free of page globals so tests can
// drive it with a fake navigator.

export type PushSettingsState = "checking" | "not-configured" | "unsupported" | "install" | "denied" | "disabled" | "enabled" | "error";

export interface PushSettingsEnvironment {
	navigator: Navigator;
	window: { matchMedia?: (query: string) => { matches: boolean }; PushManager?: unknown; Notification?: { permission: NotificationPermission } };
	fetchImpl: typeof fetch;
}

function decodeKey(value: string) {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")), (character) => character.charCodeAt(0));
}

function sameKey(buffer: ArrayBuffer | null | undefined, key: Uint8Array<ArrayBuffer>) {
	if (!buffer) return false;
	const bytes = new Uint8Array(buffer);
	return bytes.length === key.length && bytes.every((byte, index) => byte === key[index]);
}

export function isAppleMobile(navigator: Navigator) {
	// iPadOS reports a Mac user agent; touch points tell them apart.
	return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(environment: PushSettingsEnvironment) {
	return environment.window.matchMedia?.("(display-mode: standalone)").matches === true
		|| (environment.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function attachPushSettings(root: HTMLElement, environment: PushSettingsEnvironment) {
	const { navigator, fetchImpl } = environment;
	const publicKey = root.dataset.pushPublicKey ?? "";
	const status = root.querySelector<HTMLElement>("[data-push-status]");
	const enable = root.querySelector<HTMLButtonElement>("[data-push-enable]");
	const disable = root.querySelector<HTMLButtonElement>("[data-push-disable]");
	let registration: ServiceWorkerRegistration | null = null;
	let key: Uint8Array<ArrayBuffer> | null = null;

	const messages: Record<PushSettingsState, string> = {
		checking: "Checking this device…",
		"not-configured": "Push notifications are not configured on the server yet.",
		unsupported: "This browser does not support web push notifications.",
		install: "Add EONMUN to your Home Screen to enable notifications on this device.",
		denied: "Notifications are blocked for this site. Allow them in your device or browser settings, then reload this page.",
		disabled: "Notifications are off on this device.",
		enabled: "Paid-order alerts are on for this device.",
		error: "Notifications could not be checked on this device.",
	};

	const show = (state: PushSettingsState, message = messages[state]) => {
		root.dataset.pushState = state;
		if (status) status.textContent = message;
		for (const guide of root.querySelectorAll<HTMLElement>("[data-push-guide]")) guide.hidden = guide.dataset.pushGuide !== state;
		if (enable) { enable.hidden = state !== "disabled"; enable.disabled = state !== "disabled"; }
		if (disable) { disable.hidden = state !== "enabled"; disable.disabled = false; }
	};

	const post = async (path: string, body: unknown, method = "POST") => {
		const response = await fetchImpl(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
		const result = await response.json().catch(() => ({})) as { error?: string; registered?: boolean };
		return { response, result };
	};

	const permission = () => environment.window.Notification?.permission ?? "default";

	async function check() {
		if (!publicKey) return show("not-configured");
		const supported = "serviceWorker" in navigator && environment.window.PushManager !== undefined && environment.window.Notification !== undefined;
		if (!supported) return show(isAppleMobile(navigator) && !isStandalone(environment) ? "install" : "unsupported");
		key = decodeKey(publicKey);
		// The worker has no fetch handler, so registering it caches nothing.
		await navigator.serviceWorker.register(root.dataset.pushWorker ?? "/push-sw.js", { scope: root.dataset.pushScope ?? "/admin/" });
		// subscribe() needs an active worker; resolving it now keeps the tap handler free of awaits.
		registration = await navigator.serviceWorker.ready;
		if (permission() === "denied") return show("denied");
		const subscription = await registration.pushManager.getSubscription();
		if (!subscription) return show("disabled");
		if (!sameKey(subscription.options.applicationServerKey, key)) {
			// Created for an older server key: it can never receive alerts again.
			await subscription.unsubscribe();
			return show("disabled");
		}
		const { response, result } = await post("/api/admin/push/status", { endpoint: subscription.endpoint });
		show(response.ok && result.registered ? "enabled" : "disabled");
	}

	enable?.addEventListener("click", () => {
		if (!registration || !key) return;
		// CRITICAL: Safari grants permission only when subscribe() runs synchronously
		// inside the tap handler. Do not add an await or a promise hop before it.
		const subscribing = registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
		enable.disabled = true;
		if (status) status.textContent = "Waiting for permission…";
		void subscribing.then(async (subscription) => {
			const { response, result } = await post("/api/admin/push/subscription", subscription.toJSON());
			if (!response.ok) throw new Error(result.error ?? "This device could not be registered.");
			show("enabled");
		}).catch((error: unknown) => {
			if (permission() === "denied") return show("denied");
			show("disabled", error instanceof Error && error.message && !/^(NotAllowedError|AbortError)/.test(error.name)
				? error.message
				: "Notifications were not enabled. Tap Enable notifications to try again.");
		});
	});

	disable?.addEventListener("click", async () => {
		if (!registration) return;
		disable.disabled = true;
		try {
			const subscription = await registration.pushManager.getSubscription();
			if (subscription) {
				const { response, result } = await post("/api/admin/push/subscription", { endpoint: subscription.endpoint }, "DELETE");
				if (!response.ok && response.status !== 404) throw new Error(result.error ?? "This device could not be removed.");
				await subscription.unsubscribe();
			}
			show("disabled");
		} catch (error) {
			show("enabled", error instanceof Error ? error.message : "This device could not be removed.");
		}
	});

	for (const button of root.querySelectorAll<HTMLButtonElement>("[data-push-remove-id]")) {
		button.addEventListener("click", async () => {
			button.disabled = true;
			const { response } = await post("/api/admin/push/subscription", { id: Number(button.dataset.pushRemoveId) }, "DELETE").catch(() => ({ response: null }));
			if (!response?.ok && response?.status !== 404) {
				button.disabled = false;
				return;
			}
			button.closest("li")?.remove();
			// The removed device may be this one.
			await check().catch(() => show("error"));
		});
	}

	show("checking");
	const ready = check().catch(() => show("error"));
	return { ready };
}
