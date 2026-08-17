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

interface StripeCheckoutEvent {
	id: string;
	type: string;
	data?: { object?: { payment_status?: string; metadata?: { artworkSlug?: string; productId?: string } } };
}

export async function handleStripeWebhook(
	request: Request,
	secret: string | undefined,
	markPaid: (eventId: string, productId: number, artworkSlug: string) => Promise<boolean>,
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
	let event: StripeCheckoutEvent;
	try {
		event = JSON.parse(new TextDecoder().decode(body)) as StripeCheckoutEvent;
	} catch {
		return Response.json({ error: "Invalid Stripe event" }, { status: 400 });
	}
	const checkout = event.data?.object;
	const isPaidEvent =
		event.type === "checkout.session.async_payment_succeeded" ||
		(event.type === "checkout.session.completed" && checkout?.payment_status === "paid");
	if (isPaidEvent) {
		if (!checkout) return Response.json({ error: "Invalid Stripe event" }, { status: 400 });
		const artworkSlug = checkout.metadata?.artworkSlug;
		const productId = Number(checkout.metadata?.productId);
		if (!event.id || !artworkSlug || !Number.isInteger(productId) || productId <= 0) {
			return Response.json({ error: "Invalid Stripe metadata" }, { status: 400 });
		}
		// CRITICAL: checkout creates a Stripe session without reserving inventory, so two
		// buyers can pay for the same one-of-a-kind artwork. markPaid only updates while
		// soldAt IS NULL, so a false result is either a Stripe replay of an event already
		// applied or a genuine second payment that now needs a refund. Both are invisible
		// unless recorded here.
		if (!await markPaid(event.id, productId, artworkSlug)) {
			console.error(JSON.stringify({
				message: "stripe paid event did not mark an artwork sold",
				eventId: event.id,
				productId,
				artworkSlug,
			}));
		}
	}
	return Response.json({ received: true });
}
