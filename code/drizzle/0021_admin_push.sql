CREATE TABLE `admin_push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_id` text NOT NULL,
	`owner_email` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`vapid_public_key` text NOT NULL,
	`device_label` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`last_success_at` integer,
	`last_failure_at` integer,
	`last_test_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_push_subscriptions_endpoint_unique` ON `admin_push_subscriptions` (`endpoint`);
--> statement-breakpoint
CREATE INDEX `admin_push_subscriptions_owner_idx` ON `admin_push_subscriptions` (`owner_id`);
--> statement-breakpoint
CREATE TABLE `admin_order_notifications` (
	`order_id` text PRIMARY KEY NOT NULL,
	`artwork_title` text NOT NULL,
	`amount_total` integer NOT NULL,
	`currency` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_push_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` text NOT NULL REFERENCES `admin_order_notifications`(`order_id`) ON DELETE CASCADE,
	`subscription_id` integer REFERENCES `admin_push_subscriptions`(`id`) ON DELETE SET NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer NOT NULL,
	`lease_until` integer,
	`last_status` integer,
	`last_error` text,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_push_deliveries_order_subscription_unique` ON `admin_push_deliveries` (`order_id`,`subscription_id`);
--> statement-breakpoint
CREATE INDEX `admin_push_deliveries_due_idx` ON `admin_push_deliveries` (`status`,`next_attempt_at`);
