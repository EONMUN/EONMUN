/**
 * Paid-order alerts for admins over standards-based Web Push.
 *
 * Call `enqueueAdminOrderNotification` after the order is committed for every
 * verified paid Stripe event, including replays. It never throws:
 *
 * - `queued`: the alert was recorded for the devices enrolled now.
 * - `duplicate`: the order was already recorded; nothing new is sent.
 * - `not_configured`: VAPID keys are missing; nothing is stored.
 * - `invalid` / `failed`: logged; the order itself is unaffected. A caller that
 *   wants Stripe to retry a `failed` enqueue may return a 5xx itself.
 *
 * Delivery runs in the background after the response and from the per-minute
 * cron, with bounded retries. See CONTRIBUTOR.md "Admin order notifications".
 */
import { waitUntil } from "cloudflare:workers";
import type { OrderNotificationInput } from "../db/admin-push";
import { dispatchAdminPush, enqueueOrderNotification, type AdminPushEnv, type EnqueueResult } from "./push/dispatch";

export type { EnqueueResult, OrderNotificationInput };

export async function enqueueAdminOrderNotification(env: AdminPushEnv, order: OrderNotificationInput): Promise<EnqueueResult> {
	const result = await enqueueOrderNotification(env, order);
	if (result.status === "queued") {
		// The cron dispatcher retries anything this early attempt cannot finish.
		waitUntil(dispatchAdminPush(env, { orderId: order.orderId }).catch((error) => {
			console.error(JSON.stringify({ message: "Admin order notification dispatch failed", orderId: order.orderId, error: error instanceof Error ? error.message : "Unknown error" }));
		}));
	}
	return result;
}
