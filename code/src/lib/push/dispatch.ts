import {
	claimDueDeliveries,
	insertOrderNotification,
	recordSubscriptionOutcome,
	removeSubscriptionQueries,
	type ClaimedDelivery,
	type OrderNotificationInput,
} from "../../db/admin-push";
import { adminPushDeliveries, adminPushSubscriptions, getDb, type Database, type Env } from "../../db";
import { and, eq } from "drizzle-orm";
import { getAllowedAdminEmails, isAllowedAdminEmail } from "../auth";
import { getVapidConfig, isPushConfigured, type PushEnv } from "./config";
import { pushTopic, sendPush, type PushOutcome, type PushPayload } from "./send";

export type AdminPushEnv = Env & PushEnv;

export const MAX_ATTEMPTS = 6;
// Delay after attempts 1–5; the sixth failure is final, roughly 53 minutes after the sale.
const RETRY_DELAYS_MS = [1, 2, 5, 15, 30].map((minutes) => minutes * 60_000);
const MAX_RETRY_AFTER_MS = 60 * 60_000;
export const NOTIFICATION_MAX_AGE_MS = 24 * 60 * 60_000;
// Exceeds one batch of parallel sends bounded by the 10 s request timeout.
const LEASE_MS = 2 * 60_000;
// Keeps one run well under the Workers subrequest limit: claim, load, sends, one write batch.
export const DISPATCH_BATCH_SIZE = 10;

const ORDER_ID_PATTERN = /^[A-Za-z0-9_.:-]{1,200}$/;
const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

export class OrderNotificationInputError extends Error {}

export function parseOrderNotification(order: OrderNotificationInput): OrderNotificationInput {
	if (typeof order?.orderId !== "string" || !ORDER_ID_PATTERN.test(order.orderId)) throw new OrderNotificationInputError("Invalid order ID");
	if (typeof order.artworkTitle !== "string" || !order.artworkTitle.trim()) throw new OrderNotificationInputError("Invalid artwork title");
	if (!Number.isSafeInteger(order.amountTotal) || order.amountTotal < 0) throw new OrderNotificationInputError("Invalid amount");
	if (typeof order.currency !== "string" || !CURRENCY_PATTERN.test(order.currency)) throw new OrderNotificationInputError("Invalid currency");
	return {
		orderId: order.orderId,
		artworkTitle: order.artworkTitle.trim().slice(0, 120),
		amountTotal: order.amountTotal,
		currency: order.currency.toUpperCase(),
	};
}

export function formatOrderAmount(amountTotal: number, currency: string) {
	try {
		const format = new Intl.NumberFormat("en-US", { style: "currency", currency });
		// Stripe amounts are in the currency's minor unit.
		return format.format(amountTotal / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
	} catch {
		return `${amountTotal} ${currency}`;
	}
}

export function orderAlertPayload(order: Pick<OrderNotificationInput, "orderId" | "artworkTitle" | "amountTotal" | "currency">): PushPayload {
	// SECURITY: alerts render on lock screens, so they carry no buyer name, email, or address.
	return {
		title: "Order paid",
		body: `${order.artworkTitle} · ${formatOrderAmount(order.amountTotal, order.currency)}`,
		url: `/admin/orders/${encodeURIComponent(order.orderId)}`,
		tag: `order-${order.orderId}`,
	};
}

export const TEST_PAYLOAD: PushPayload = {
	title: "EONMUN test notification",
	body: "Paid-order alerts are enabled on this device.",
	url: "/admin/notifications",
	tag: "eonmun-test",
};

export type EnqueueResult =
	| { status: "queued"; recipients: number }
	| { status: "duplicate"; recipients: number }
	| { status: "not_configured" }
	| { status: "invalid"; error: string }
	| { status: "failed"; error: string };

export async function enqueueOrderNotification(
	env: AdminPushEnv,
	order: OrderNotificationInput,
	options: { db?: Database; now?: Date } = {},
): Promise<EnqueueResult> {
	if (!isPushConfigured(env)) return { status: "not_configured" };
	let parsed: OrderNotificationInput;
	try {
		parsed = parseOrderNotification(order);
	} catch (error) {
		return { status: "invalid", error: error instanceof Error ? error.message : "Invalid order" };
	}
	try {
		const result = await insertOrderNotification(env, parsed, [...getAllowedAdminEmails(env)], options.now ?? new Date(), options.db ?? getDb(env));
		return { status: result.created ? "queued" : "duplicate", recipients: result.recipients };
	} catch (error) {
		console.error(JSON.stringify({ message: "Admin order notification could not be queued", orderId: parsed.orderId, error: error instanceof Error ? error.message : "Unknown error" }));
		return { status: "failed", error: "Notification could not be queued" };
	}
}

export interface DispatchSummary {
	claimed: number;
	sent: number;
	retrying: number;
	failed: number;
	removed: number;
}

function retryDelay(attempts: number, retryAfterMs: number | null) {
	const base = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length) - 1] ?? RETRY_DELAYS_MS[0];
	return Math.min(Math.max(base, retryAfterMs ?? 0), MAX_RETRY_AFTER_MS);
}

type Decision =
	| { kind: "skip"; status: "cancelled" | "revoked" | "stale" | "failed"; error: string; remove: boolean }
	| { kind: "send"; outcome: PushOutcome };

export async function dispatchAdminPush(
	env: AdminPushEnv,
	options: { db?: Database; fetchImpl?: typeof fetch; now?: () => number; orderId?: string } = {},
): Promise<DispatchSummary> {
	const summary: DispatchSummary = { claimed: 0, sent: 0, retrying: 0, failed: 0, removed: 0 };
	const configPromise = getVapidConfig(env);
	if (!configPromise) return summary;
	// An empty allowlist is a misconfiguration; revoking every device on it would be destructive.
	if (getAllowedAdminEmails(env).size === 0) return summary;
	const config = await configPromise.catch((error: unknown) => {
		console.error(JSON.stringify({ message: "Admin push is misconfigured; alerts stay queued", error: error instanceof Error ? error.message : "Unknown error" }));
		return null;
	});
	if (!config) return summary;
	const clock = options.now ?? Date.now;
	const db = options.db ?? getDb(env);
	const started = new Date(clock());
	const claimed = await claimDueDeliveries(db, started, new Date(started.getTime() + LEASE_MS), DISPATCH_BATCH_SIZE, options.orderId);
	summary.claimed = claimed.length;
	if (!claimed.length) return summary;

	const decisions = await Promise.all(claimed.map(async (delivery): Promise<[ClaimedDelivery, Decision]> => {
		if (delivery.subscriptionId === null || !delivery.endpoint || !delivery.p256dh || !delivery.auth) {
			return [delivery, { kind: "skip", status: "cancelled", error: "Device was removed", remove: false }];
		}
		if (!isAllowedAdminEmail(delivery.ownerEmail, env)) {
			return [delivery, { kind: "skip", status: "revoked", error: "Admin access was removed", remove: true }];
		}
		if (delivery.vapidPublicKey !== config.publicKey) {
			return [delivery, { kind: "skip", status: "stale", error: "Device was enabled with a previous VAPID key", remove: true }];
		}
		if (started.getTime() - delivery.notificationCreatedAt.getTime() > NOTIFICATION_MAX_AGE_MS) {
			return [delivery, { kind: "skip", status: "failed", error: "Expired before delivery", remove: false }];
		}
		const outcome = await sendPush(config, { endpoint: delivery.endpoint, p256dh: delivery.p256dh, auth: delivery.auth }, orderAlertPayload(delivery), {
			fetchImpl: options.fetchImpl,
			now: clock(),
			// Lets the push service collapse a duplicate if a lease expires mid-send.
			topic: await pushTopic(`order:${delivery.orderId}`),
		});
		return [delivery, { kind: "send", outcome }];
	}));

	const finished = new Date(clock());
	const writes: Parameters<Database["batch"]>[0][number][] = [];
	const removed = new Set<number>();
	for (const [delivery, decision] of decisions) {
		// CRITICAL: only the holder of the current lease may record a result.
		const owned = and(eq(adminPushDeliveries.id, delivery.id), eq(adminPushDeliveries.leaseUntil, delivery.leaseUntil!));
		const settle = (values: Partial<typeof adminPushDeliveries.$inferInsert>) =>
			writes.push(db.update(adminPushDeliveries).set({ leaseUntil: null, updatedAt: finished, ...values }).where(owned));
		const remove = (status: "revoked" | "stale" | "expired") => {
			if (delivery.subscriptionId === null || removed.has(delivery.subscriptionId)) return;
			removed.add(delivery.subscriptionId);
			writes.push(...removeSubscriptionQueries(db, delivery.subscriptionId, status, finished));
		};
		if (decision.kind === "skip") {
			summary.failed++;
			settle({ status: decision.status, lastError: decision.error, lastStatus: null });
			if (decision.remove) remove(decision.status as "revoked" | "stale");
			continue;
		}
		const { outcome } = decision;
		const subscriptionId = delivery.subscriptionId!;
		if (outcome.kind === "sent") {
			summary.sent++;
			settle({ status: "sent", sentAt: finished, lastStatus: outcome.status, lastError: null });
			writes.push(db.update(adminPushSubscriptions).set({ lastSuccessAt: finished }).where(eq(adminPushSubscriptions.id, subscriptionId)));
		} else if (outcome.kind === "gone") {
			summary.failed++;
			settle({ status: "expired", lastStatus: outcome.status, lastError: "Subscription expired" });
			remove("expired");
		} else if (outcome.kind === "retry" && delivery.attempts < MAX_ATTEMPTS) {
			summary.retrying++;
			settle({
				status: "pending", lastStatus: outcome.status, lastError: outcome.error,
				nextAttemptAt: new Date(finished.getTime() + retryDelay(delivery.attempts, outcome.retryAfterMs)),
			});
			writes.push(db.update(adminPushSubscriptions).set({ lastFailureAt: finished }).where(eq(adminPushSubscriptions.id, subscriptionId)));
		} else {
			summary.failed++;
			settle({ status: "failed", lastStatus: outcome.status, lastError: outcome.kind === "retry" ? `${outcome.error}; retries exhausted` : outcome.error });
			writes.push(db.update(adminPushSubscriptions).set({ lastFailureAt: finished }).where(eq(adminPushSubscriptions.id, subscriptionId)));
		}
	}
	summary.removed = removed.size;
	if (writes.length) await db.batch(writes as unknown as Parameters<Database["batch"]>[0]);
	return summary;
}

export async function sendTestNotification(
	env: AdminPushEnv,
	subscription: { id: number; endpoint: string; p256dh: string; auth: string; vapidPublicKey: string },
	options: { db?: Database; fetchImpl?: typeof fetch } = {},
) {
	const configPromise = getVapidConfig(env);
	if (!configPromise) return { ok: false as const, error: "Push notifications are not configured" };
	const config = await configPromise.catch(() => null);
	if (!config) return { ok: false as const, error: "The server's push keys are misconfigured." };
	const db = options.db ?? getDb(env);
	const now = new Date();
	if (subscription.vapidPublicKey !== config.publicKey) {
		await db.batch(removeSubscriptionQueries(db, subscription.id, "stale", now));
		return { ok: false as const, error: "This device was enabled with an old key. Enable notifications again.", removed: true };
	}
	const outcome = await sendPush(config, subscription, TEST_PAYLOAD, { fetchImpl: options.fetchImpl });
	if (outcome.kind === "sent") {
		await recordSubscriptionOutcome(db, subscription.id, true, now);
		return { ok: true as const };
	}
	if (outcome.kind === "gone") {
		await db.batch(removeSubscriptionQueries(db, subscription.id, "expired", now));
		return { ok: false as const, error: "This device's subscription has expired. Enable notifications again.", removed: true };
	}
	await recordSubscriptionOutcome(db, subscription.id, false, now);
	return { ok: false as const, error: `The push service did not accept the test (${outcome.error}).` };
}
