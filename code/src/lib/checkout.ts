import { SLUG_PATTERN } from "./slug";

export interface CheckoutItem {
	artworkSlug: string;
	name: string;
	priceCents: number;
	productId: number;
}

export function parseCheckoutArtworkSlug(value: unknown) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid checkout request");
	const body = value as Record<string, unknown>;
	if (Object.keys(body).some((key) => key !== "artworkSlug")) throw new Error("Checkout accepts only artworkSlug");
	if (typeof body.artworkSlug !== "string" || !SLUG_PATTERN.test(body.artworkSlug)) {
		throw new Error("Invalid artworkSlug");
	}
	return body.artworkSlug;
}

export async function createStripeCheckoutSession(
	secretKey: string,
	item: CheckoutItem,
	origin: string,
	fetcher: typeof fetch = fetch,
) {
	const artworkUrl = new URL(`/artworks/${item.artworkSlug}`, origin).toString();
	const body = new URLSearchParams({
		mode: "payment",
		"line_items[0][quantity]": "1",
		"line_items[0][price_data][currency]": "usd",
		"line_items[0][price_data][unit_amount]": String(item.priceCents),
		"line_items[0][price_data][product_data][name]": item.name,
		"metadata[artworkSlug]": item.artworkSlug,
		"metadata[productId]": String(item.productId),
		success_url: `${artworkUrl}?checkout=success`,
		cancel_url: `${artworkUrl}?checkout=cancelled`,
	});
	const response = await fetcher("https://api.stripe.com/v1/checkout/sessions", {
		method: "POST",
		headers: { authorization: `Bearer ${secretKey}`, "content-type": "application/x-www-form-urlencoded" },
		body,
	});
	if (!response.ok) throw new Error("Stripe Checkout is temporarily unavailable");
	const session = await response.json() as { url?: unknown };
	if (typeof session.url !== "string" || !session.url.startsWith("https://checkout.stripe.com/")) {
		throw new Error("Stripe returned an invalid Checkout URL");
	}
	return session.url;
}

export async function handleCheckoutRequest(
	request: Request,
	secretKey: string | undefined,
	lookup: (slug: string) => Promise<CheckoutItem | null>,
	createSession = createStripeCheckoutSession,
) {
	if (!secretKey) return Response.json({ error: "Checkout is unavailable" }, { status: 503 });
	try {
		const contentType = request.headers.get("content-type") ?? "";
		let input: Record<string, unknown>;
		if (contentType.includes("application/json")) {
			input = await request.json() as Record<string, unknown>;
		} else {
			const form = await request.formData();
			input = Object.fromEntries(form.entries());
		}
		const artworkSlug = parseCheckoutArtworkSlug(input);
		const item = await lookup(artworkSlug);
		if (!item) return Response.json({ error: "Artwork is not available" }, { status: 409 });
		const url = await createSession(secretKey, item, new URL(request.url).origin);
		return Response.redirect(url, 303);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Checkout failed";
		return Response.json({ error: message }, { status: /only artworkSlug|Invalid/.test(message) ? 400 : 503 });
	}
}
