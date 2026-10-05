// Admin paid-order alerts. Registered from /admin/notifications with scope /admin/.
//
// CRITICAL: there is deliberately no fetch handler. Admin pages, checkout, and
// API responses must never be served from a service worker cache.

const FALLBACK_URL = "/admin/notifications";

function adminUrl(value) {
	try {
		const url = new URL(typeof value === "string" ? value : FALLBACK_URL, self.location.origin);
		// SECURITY: a payload can only open this site's admin pages.
		if (url.origin === self.location.origin && url.pathname.startsWith("/admin/")) return url.href;
	} catch {
		// Fall through to the default page.
	}
	return new URL(FALLBACK_URL, self.location.origin).href;
}

function text(value, fallback, limit) {
	return typeof value === "string" && value.trim() ? value.trim().slice(0, limit) : fallback;
}

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
	let data = {};
	try {
		data = event.data ? event.data.json() : {};
	} catch {
		data = {};
	}
	// Safari revokes push permission when a push does not show a notification,
	// so even an unreadable payload produces one.
	event.waitUntil(self.registration.showNotification(text(data.title, "EONMUN", 80), {
		body: text(data.body, "Open the admin console for details.", 200),
		tag: text(data.tag, "eonmun-admin", 64),
		icon: "/android-chrome-192x192.png",
		badge: "/favicon-32x32.png",
		data: { url: adminUrl(data.url) },
	}));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = adminUrl(event.notification.data && event.notification.data.url);
	event.waitUntil((async () => {
		const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
		const existing = windows.find((client) => client.url === target);
		if (existing && "focus" in existing) return existing.focus();
		return self.clients.openWindow(target);
	})());
});

self.addEventListener("pushsubscriptionchange", (event) => {
	const previous = event.oldSubscription;
	const key = previous && previous.options && previous.options.applicationServerKey;
	if (!key) return;
	// Re-registers with the same signed-in admin cookie; the server re-checks the session.
	event.waitUntil((async () => {
		const next = event.newSubscription || await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
		const headers = { "content-type": "application/json" };
		const registered = await fetch("/api/admin/push/subscription", { method: "POST", headers, credentials: "same-origin", body: JSON.stringify(next.toJSON()) });
		// Keep the old registration unless the new one is stored; a refreshed key
		// can keep the same endpoint, and deleting it would remove the device.
		if (!registered.ok || next.endpoint === previous.endpoint) return;
		await fetch("/api/admin/push/subscription", { method: "DELETE", headers, credentials: "same-origin", body: JSON.stringify({ endpoint: previous.endpoint }) });
	})().catch(() => undefined));
});
