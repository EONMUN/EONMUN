import { claimTestSend, getOwnedSubscription, MAX_DEVICES_PER_ADMIN, removeOwnedSubscription, upsertAdminPushSubscription } from "../../db/admin-push";
import { adminPushSubscriptions, getDb, type Database } from "../../db";
import { requireAdminMutation } from "../admin-guard";
import { isAllowedAdminEmail, type AuthEnv } from "../auth";
import { eq } from "drizzle-orm";
import { getVapidPublicKey } from "./config";
import { sendTestNotification, type AdminPushEnv } from "./dispatch";
import { deviceLabel, parseEndpointBody, parsePushEndpoint, parseSubscriptionInput, PushInputError, readJsonBody } from "./subscription-input";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

type Owner = { id: string; email: string };
type Context = { owner: Owner; body: unknown; publicKey: string; db: Database };
export type PushApiOptions = { db?: Database; fetchImpl?: typeof fetch };

// Shared gate: same-origin admin session, push configured, bounded JSON body.
async function pushMutation(
	request: Request,
	env: AdminPushEnv,
	options: PushApiOptions,
	handler: (context: Context) => Promise<Response>,
	// Removing a device must keep working while keys are absent, or it would resume alerts once they return.
	requiresKeys = true,
) {
	const guard = await requireAdminMutation(request, env as AuthEnv);
	if ("response" in guard) return guard.response;
	// getSession maps `id` to the stable Google account ID.
	const id = guard.session.user.id;
	if (!id) return json({ error: "Unauthorized" }, 401);
	const publicKey = getVapidPublicKey(env) ?? "";
	if (requiresKeys && !publicKey) return json({ error: "Push notifications are not configured" }, 503);
	let body: unknown;
	try {
		body = await readJsonBody(request);
	} catch (error) {
		const message = error instanceof PushInputError ? error.message : "Invalid request";
		return json({ error: message }, message.includes("too large") ? 413 : 400);
	}
	try {
		return await handler({ owner: { id, email: guard.session.user.email.toLowerCase() }, body, publicKey, db: options.db ?? getDb(env) });
	} catch (error) {
		if (error instanceof PushInputError) return json({ error: error.message }, 400);
		throw error;
	}
}

export function subscribe(request: Request, env: AdminPushEnv, options: PushApiOptions = {}) {
	return pushMutation(request, env, options, async ({ owner, body, publicKey, db }) => {
		const input = await parseSubscriptionInput(body);
		const result = await upsertAdminPushSubscription(env, owner, input, publicKey, deviceLabel(request.headers.get("user-agent")), new Date(), db);
		if (result === "limit") return json({ error: `Remove an older device first; each admin can enable up to ${MAX_DEVICES_PER_ADMIN}.` }, 409);
		if (result === "conflict") return json({ error: "This device was registered at the same time elsewhere. Try again." }, 409);
		return json({ registered: true }, result === "created" ? 201 : 200);
	});
}

export function unsubscribe(request: Request, env: AdminPushEnv, options: PushApiOptions = {}) {
	return pushMutation(request, env, options, async ({ owner, body, db }) => {
		const { endpoint, id } = (body ?? {}) as { endpoint?: unknown; id?: unknown };
		let target: { endpoint: string } | { id: number };
		if (endpoint !== undefined) target = { endpoint: parsePushEndpoint(endpoint).href };
		else if (typeof id === "number" && Number.isSafeInteger(id) && id > 0) target = { id };
		else throw new PushInputError("Specify a device");
		// Another admin's device and a missing one answer the same way.
		return await removeOwnedSubscription(env, owner.id, target, new Date(), db) ? json({ removed: true }) : json({ error: "Device not found" }, 404);
	}, false);
}

// POST keeps the endpoint, a delivery capability, out of URLs and logs.
export function subscriptionStatus(request: Request, env: AdminPushEnv, options: PushApiOptions = {}) {
	return pushMutation(request, env, options, async ({ owner, body, publicKey, db }) => {
		const subscription = await getOwnedSubscription(env, owner.id, parseEndpointBody(body), db);
		return json({ registered: subscription !== null && subscription.vapidPublicKey === publicKey });
	});
}

// Admins can test an enrolled device by ID without exposing its delivery endpoint.
export function sendTest(request: Request, env: AdminPushEnv, options: PushApiOptions = {}) {
	return pushMutation(request, env, options, async ({ owner, body, db }) => {
		const id = (body as { deviceId?: unknown } | null)?.deviceId;
		let targetOwner = owner.id;
		let endpoint: string;
		if (id !== undefined) {
			if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) throw new PushInputError("Invalid device");
			const [target] = await db.select().from(adminPushSubscriptions).where(eq(adminPushSubscriptions.id, id));
			if (!target || !isAllowedAdminEmail(target.ownerEmail, env)) return json({ error: "Device not found" }, 404);
			targetOwner = target.ownerId;
			endpoint = target.endpoint;
		} else {
			endpoint = parseEndpointBody(body);
		}
		const subscription = await claimTestSend(env, targetOwner, endpoint, new Date(), db);
		if (subscription === null) return json({ error: "Device not found" }, 404);
		if (subscription === "rate_limited") return json({ error: "Wait a minute before sending another test." }, 429);
		const result = await sendTestNotification(env, subscription, { db, fetchImpl: options.fetchImpl });
		return json(result, result.ok ? 200 : 502);
	});
}
