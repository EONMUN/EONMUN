// Admin Web Push state. Migration: code/drizzle/0021_admin_push.sql.
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const adminPushSubscriptions = sqliteTable(
	"admin_push_subscriptions",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		// Stable Google account ID from the admin session, not the mutable email.
		ownerId: text("owner_id").notNull(),
		ownerEmail: text("owner_email").notNull(),
		endpoint: text("endpoint").notNull(),
		p256dh: text("p256dh").notNull(),
		auth: text("auth").notNull(),
		// A subscription only accepts messages signed by the key it was created with.
		vapidPublicKey: text("vapid_public_key").notNull(),
		deviceLabel: text("device_label"),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		lastSuccessAt: integer("last_success_at", { mode: "timestamp_ms" }),
		lastFailureAt: integer("last_failure_at", { mode: "timestamp_ms" }),
		lastTestAt: integer("last_test_at", { mode: "timestamp_ms" }),
	},
	(table) => ({
		endpointUnique: uniqueIndex("admin_push_subscriptions_endpoint_unique").on(table.endpoint),
		ownerIdx: index("admin_push_subscriptions_owner_idx").on(table.ownerId),
	}),
);

export const adminOrderNotifications = sqliteTable("admin_order_notifications", {
	orderId: text("order_id").primaryKey(),
	artworkTitle: text("artwork_title").notNull(),
	amountTotal: integer("amount_total").notNull(),
	currency: text("currency").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const ADMIN_PUSH_DELIVERY_STATUSES = ["pending", "sent", "failed", "expired", "revoked", "stale", "cancelled"] as const;
export type AdminPushDeliveryStatus = (typeof ADMIN_PUSH_DELIVERY_STATUSES)[number];

export const adminPushDeliveries = sqliteTable(
	"admin_push_deliveries",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		orderId: text("order_id").notNull().references(() => adminOrderNotifications.orderId, { onDelete: "cascade" }),
		// Kept as history after the device is removed.
		subscriptionId: integer("subscription_id").references(() => adminPushSubscriptions.id, { onDelete: "set null" }),
		status: text("status", { enum: ADMIN_PUSH_DELIVERY_STATUSES }).notNull().default("pending"),
		attempts: integer("attempts").notNull().default(0),
		nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }).notNull(),
		leaseUntil: integer("lease_until", { mode: "timestamp_ms" }),
		lastStatus: integer("last_status"),
		lastError: text("last_error"),
		sentAt: integer("sent_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => ({
		orderSubscriptionUnique: uniqueIndex("admin_push_deliveries_order_subscription_unique").on(table.orderId, table.subscriptionId),
		dueIdx: index("admin_push_deliveries_due_idx").on(table.status, table.nextAttemptAt),
	}),
);
