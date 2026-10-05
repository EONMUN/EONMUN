import { and, asc, desc, eq, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import {
	adminOrderNotifications,
	adminPushDeliveries,
	adminPushSubscriptions,
	getDb,
	type AdminPushDeliveryStatus,
	type Database,
	type Env,
} from "./index";
import type { PushSubscriptionInput } from "../lib/push/subscription-input";

// Bounds the fan-out of one sale; each device is one outbound request per alert.
export const MAX_DEVICES_PER_ADMIN = 10;
export const TEST_SEND_INTERVAL_MS = 60_000;

export interface AdminPushOwner {
	id: string;
	email: string;
}

export interface OrderNotificationInput {
	orderId: string;
	artworkTitle: string;
	amountTotal: number;
	currency: string;
}

export type SubscribeResult = "created" | "updated" | "limit";

export async function upsertAdminPushSubscription(
	env: Env,
	owner: AdminPushOwner,
	input: PushSubscriptionInput,
	vapidPublicKey: string,
	label: string | null,
	now = new Date(),
	db: Database = getDb(env),
): Promise<SubscribeResult> {
	const [existing] = await db.select({ id: adminPushSubscriptions.id, ownerId: adminPushSubscriptions.ownerId })
		.from(adminPushSubscriptions).where(eq(adminPushSubscriptions.endpoint, input.endpoint));
	if (existing?.ownerId === owner.id) {
		// Same browser refreshing its keys keeps its identity, so queued alerts still reach it.
		await db.update(adminPushSubscriptions).set({
			ownerEmail: owner.email, p256dh: input.p256dh, auth: input.auth, vapidPublicKey, deviceLabel: label, updatedAt: now,
		}).where(and(eq(adminPushSubscriptions.id, existing.id), eq(adminPushSubscriptions.ownerId, owner.id)));
		return "updated";
	}
	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(adminPushSubscriptions)
		.where(eq(adminPushSubscriptions.ownerId, owner.id));
	if (count >= MAX_DEVICES_PER_ADMIN) return "limit";
	// A browser profile holds one subscription per origin. When another admin signs in
	// on it, the device moves to them as a new enrolment with no inherited alerts.
	const insert = db.insert(adminPushSubscriptions).values({
		ownerId: owner.id, ownerEmail: owner.email, endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth,
		vapidPublicKey, deviceLabel: label, createdAt: now, updatedAt: now,
	});
	if (existing) await db.batch([...removeSubscriptionQueries(db, existing.id, "cancelled", now), insert]);
	else await insert;
	return "created";
}

export function removeSubscriptionQueries(db: Database, subscriptionId: number, status: AdminPushDeliveryStatus, now: Date) {
	// Delivery rows survive as history; foreign-key enforcement is not assumed.
	return [
		db.update(adminPushDeliveries).set({ status, leaseUntil: null, updatedAt: now })
			.where(and(eq(adminPushDeliveries.subscriptionId, subscriptionId), eq(adminPushDeliveries.status, "pending"))),
		db.update(adminPushDeliveries).set({ subscriptionId: null }).where(eq(adminPushDeliveries.subscriptionId, subscriptionId)),
		db.delete(adminPushSubscriptions).where(eq(adminPushSubscriptions.id, subscriptionId)),
	] as const;
}

export async function removeOwnedSubscription(
	env: Env,
	ownerId: string,
	target: { endpoint: string } | { id: number },
	now = new Date(),
	db: Database = getDb(env),
) {
	const [row] = await db.select({ id: adminPushSubscriptions.id }).from(adminPushSubscriptions).where(and(
		eq(adminPushSubscriptions.ownerId, ownerId),
		"endpoint" in target ? eq(adminPushSubscriptions.endpoint, target.endpoint) : eq(adminPushSubscriptions.id, target.id),
	));
	if (!row) return false;
	await db.batch(removeSubscriptionQueries(db, row.id, "cancelled", now));
	return true;
}

export async function getOwnedSubscription(env: Env, ownerId: string, endpoint: string, db: Database = getDb(env)) {
	const [row] = await db.select().from(adminPushSubscriptions)
		.where(and(eq(adminPushSubscriptions.ownerId, ownerId), eq(adminPushSubscriptions.endpoint, endpoint)));
	return row ?? null;
}

// Claims the one-per-minute test slot atomically, so double taps send once.
export async function claimTestSend(env: Env, ownerId: string, endpoint: string, now = new Date(), db: Database = getDb(env)) {
	const [row] = await db.update(adminPushSubscriptions).set({ lastTestAt: now }).where(and(
		eq(adminPushSubscriptions.ownerId, ownerId),
		eq(adminPushSubscriptions.endpoint, endpoint),
		or(isNull(adminPushSubscriptions.lastTestAt), lt(adminPushSubscriptions.lastTestAt, new Date(now.getTime() - TEST_SEND_INTERVAL_MS))),
	)).returning();
	if (row) return row;
	return await getOwnedSubscription(env, ownerId, endpoint, db) ? "rate_limited" as const : null;
}

export async function recordSubscriptionOutcome(db: Database, subscriptionId: number, success: boolean, now: Date) {
	await db.update(adminPushSubscriptions)
		.set(success ? { lastSuccessAt: now } : { lastFailureAt: now })
		.where(eq(adminPushSubscriptions.id, subscriptionId));
}

export async function listAdminPushDevices(env: Env, ownerId: string, db: Database = getDb(env)) {
	return db.select({
		id: adminPushSubscriptions.id,
		deviceLabel: adminPushSubscriptions.deviceLabel,
		createdAt: adminPushSubscriptions.createdAt,
		lastSuccessAt: adminPushSubscriptions.lastSuccessAt,
		lastFailureAt: adminPushSubscriptions.lastFailureAt,
	}).from(adminPushSubscriptions).where(eq(adminPushSubscriptions.ownerId, ownerId)).orderBy(desc(adminPushSubscriptions.createdAt));
}

/**
 * Records an order alert and snapshots its recipients in one transaction.
 *
 * CRITICAL: recipients are the allowlisted devices enrolled no later than the
 * alert's stored creation time. Replays reuse that stored time, so a device
 * enrolled after the first call never receives an old order.
 */
export async function insertOrderNotification(
	env: Env,
	order: OrderNotificationInput,
	allowedEmails: string[],
	now = new Date(),
	db: Database = getDb(env),
) {
	const at = now.getTime();
	const emails = allowedEmails.length ? sql.join(allowedEmails.map((email) => sql`${email}`), sql`, `) : sql`NULL`;
	const [, , existing] = await db.batch([
		db.insert(adminOrderNotifications).values({ ...order, createdAt: now }).onConflictDoNothing(),
		db.run(sql`INSERT OR IGNORE INTO admin_push_deliveries
			(order_id, subscription_id, status, attempts, next_attempt_at, created_at, updated_at)
			SELECT n.order_id, s.id, 'pending', 0, n.created_at, ${at}, ${at}
			FROM admin_order_notifications n
			JOIN admin_push_subscriptions s ON s.created_at <= n.created_at
			WHERE n.order_id = ${order.orderId} AND lower(s.owner_email) IN (${emails})`),
		db.select({ createdAt: adminOrderNotifications.createdAt }).from(adminOrderNotifications)
			.where(eq(adminOrderNotifications.orderId, order.orderId)),
	]);
	const [{ recipients }] = await db.select({ recipients: sql<number>`count(*)` }).from(adminPushDeliveries)
		.where(eq(adminPushDeliveries.orderId, order.orderId));
	return { created: existing[0]?.createdAt.getTime() === at, recipients };
}

export async function claimDueDeliveries(db: Database, now: Date, leaseUntil: Date, limit: number, orderId?: string) {
	// One UPDATE claims rows atomically, so the cron run and a post-webhook run
	// never hold the same delivery.
	const due = db.select({ id: adminPushDeliveries.id }).from(adminPushDeliveries).where(and(
		eq(adminPushDeliveries.status, "pending"),
		lte(adminPushDeliveries.nextAttemptAt, now),
		or(isNull(adminPushDeliveries.leaseUntil), lt(adminPushDeliveries.leaseUntil, now)),
		orderId === undefined ? undefined : eq(adminPushDeliveries.orderId, orderId),
	)).orderBy(asc(adminPushDeliveries.nextAttemptAt)).limit(limit);
	const claimed = await db.update(adminPushDeliveries)
		.set({ leaseUntil, attempts: sql`${adminPushDeliveries.attempts} + 1`, updatedAt: now })
		.where(and(inArray(adminPushDeliveries.id, due), eq(adminPushDeliveries.status, "pending")))
		.returning({ id: adminPushDeliveries.id });
	if (!claimed.length) return [];
	return db.select({
		id: adminPushDeliveries.id,
		attempts: adminPushDeliveries.attempts,
		leaseUntil: adminPushDeliveries.leaseUntil,
		orderId: adminOrderNotifications.orderId,
		artworkTitle: adminOrderNotifications.artworkTitle,
		amountTotal: adminOrderNotifications.amountTotal,
		currency: adminOrderNotifications.currency,
		notificationCreatedAt: adminOrderNotifications.createdAt,
		subscriptionId: adminPushSubscriptions.id,
		ownerEmail: adminPushSubscriptions.ownerEmail,
		endpoint: adminPushSubscriptions.endpoint,
		p256dh: adminPushSubscriptions.p256dh,
		auth: adminPushSubscriptions.auth,
		vapidPublicKey: adminPushSubscriptions.vapidPublicKey,
	}).from(adminPushDeliveries)
		.innerJoin(adminOrderNotifications, eq(adminOrderNotifications.orderId, adminPushDeliveries.orderId))
		.leftJoin(adminPushSubscriptions, eq(adminPushSubscriptions.id, adminPushDeliveries.subscriptionId))
		.where(inArray(adminPushDeliveries.id, claimed.map((row) => row.id)));
}

export type ClaimedDelivery = Awaited<ReturnType<typeof claimDueDeliveries>>[number];

export async function listRecentOrderNotifications(env: Env, limit = 10, db: Database = getDb(env)) {
	const notifications = await db.select().from(adminOrderNotifications)
		.orderBy(desc(adminOrderNotifications.createdAt)).limit(limit);
	if (!notifications.length) return [];
	const deliveries = await db.select({
		orderId: adminPushDeliveries.orderId,
		status: adminPushDeliveries.status,
		attempts: adminPushDeliveries.attempts,
		nextAttemptAt: adminPushDeliveries.nextAttemptAt,
		lastError: adminPushDeliveries.lastError,
		sentAt: adminPushDeliveries.sentAt,
	}).from(adminPushDeliveries).where(inArray(adminPushDeliveries.orderId, notifications.map((row) => row.orderId)));
	return notifications.map((notification) => ({
		...notification,
		deliveries: deliveries.filter((delivery) => delivery.orderId === notification.orderId),
	}));
}
