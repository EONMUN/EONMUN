import { driverErrorMessage } from "./driver-error";
import { parsePaidCheckoutEvent, type PaidCheckout, type PaidOrderResult } from "./stripe-order";

const SIGNATURE_TOLERANCE_SECONDS = 300;
const MAX_WEBHOOK_BYTES = 1024 * 1024;

function parseSignatureHeader(header: string) {
	let timestamp: number | null = null;
	const signatures: string[] = [];
	for (const part of header.split(",")) {
		const [key, value] = part.split("=", 2);
		if (key === "t") timestamp = Number(value);
		if (key === "v1" && value) signatures.push(value);
	}
	return { timestamp, signatures };
}

function hexToBytes(hex: string) {
	if (!/^[0-9a-f]{64}$/i.test(hex)) return null;
	return new Uint8Array(hex.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)));
}

export async function verifyStripeSignature(
	body: Uint8Array,
	header: string,
	secret: string,
	now = Date.now(),
) {
	const { timestamp, signatures } = parseSignatureHeader(header);
	if (!timestamp || Math.abs(Math.floor(now / 1000) - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;
	const prefix = new TextEncoder().encode(`${timestamp}.`);
	const signed = new Uint8Array(prefix.length + body.length);
	signed.set(prefix); signed.set(body, prefix.length);
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
	for (const signature of signatures) {
		const bytes = hexToBytes(signature);
		if (bytes && await crypto.subtle.verify("HMAC", key, bytes, signed)) return true;
	}
	return false;
}

export async function handleStripeWebhook(
	request: Request,
	secret: string | undefined,
	recordPaidOrder: (checkout: PaidCheckout) => Promise<PaidOrderResult>,
	now = Date.now(),
) {
	if (!secret) return Response.json({ error: "Webhook is unavailable" }, { status: 503 });
	const length = Number(request.headers.get("content-length") ?? 0);
	if (length > MAX_WEBHOOK_BYTES) return Response.json({ error: "Payload too large" }, { status: 413 });
	const body = new Uint8Array(await request.arrayBuffer());
	if (body.byteLength > MAX_WEBHOOK_BYTES) return Response.json({ error: "Payload too large" }, { status: 413 });
	const signature = request.headers.get("stripe-signature");
	if (!signature || !await verifyStripeSignature(body, signature, secret, now)) {
		return Response.json({ error: "Invalid Stripe signature" }, { status: 400 });
	}
	let checkout: PaidCheckout | null;
	try {
		checkout = parsePaidCheckoutEvent(JSON.parse(new TextDecoder().decode(body)));
	} catch {
		return Response.json({ error: "Invalid Stripe event" }, { status: 400 });
	}
	if (!checkout) return Response.json({ received: true });
	const references = { eventId: checkout.eventId, checkoutSessionId: checkout.checkoutSessionId };
	let order: PaidOrderResult;
	try {
		order = await recordPaidOrder(checkout);
	} catch (error) {
		// SECURITY: log only Stripe references and the driver's message; buyer
		// names, emails, and addresses must never reach Worker logs.
		console.error(JSON.stringify({
			message: "stripe paid order could not be processed",
			...references,
			error: driverErrorMessage(error, "Unknown error"),
		}));
		// A 5xx makes Stripe retry, so the payment is not discarded.
		return Response.json({ error: "Order could not be recorded" }, { status: 500 });
	}
	if (order.created && order.attentionReason) {
		console.error(JSON.stringify({
			message: "stripe paid order needs attention",
			reason: order.attentionReason,
			orderId: order.notification.orderId,
			...references,
			productId: checkout.productId,
			artworkSlug: checkout.artworkSlug,
		}));
	}
	return Response.json({ received: true });
}
