// Run only in the production deployment environment; never print credential values.
import { createHmac } from "node:crypto";

const worker = "eonmun-astro";
const webhookUrl = "https://eonmun.com/api/webhooks/stripe";
const events = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
const key = process.env.STRIPE_SECRET_KEY?.trim();
if (!key || !/^(sk|rk)_live_/.test(key)) {
	const kind = /^(sk|rk)_test_/.test(key ?? "") ? "test-mode secret" : /^pk_/.test(key ?? "") ? "publishable key" : "missing or unrecognized value";
	throw new Error(`Production requires a live Stripe API key; GitHub STRIPE_SECRET_KEY contains a ${kind}`);
}

async function stripe(path: string, body?: URLSearchParams, idempotencyKey?: string) {
	const response = await fetch(`https://api.stripe.com/v1/${path}`, {
		method: body ? "POST" : "GET",
		redirect: "error",
		headers: {
			authorization: `Bearer ${key}`,
			...(body ? { "content-type": "application/x-www-form-urlencoded" } : {}),
			...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
		},
		body,
	});
	if (!response.ok) throw new Error(`Stripe ${path.split("?")[0]} returned HTTP ${response.status}`);
	return response.json();
}

async function wrangler(args: string[], input?: string) {
	const child = Bun.spawn(["bunx", "wrangler", ...args, "--name", worker], {
		stdin: input === undefined ? "ignore" : new Blob([input]), stdout: "pipe", stderr: "pipe",
	});
	const [stdout, , exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
	if (exitCode !== 0) throw new Error(`Wrangler ${args.slice(0, 2).join(" ")} failed (output suppressed to protect credentials)`);
	return stdout;
}

const account = await stripe("account");
if (!account.charges_enabled) throw new Error("Stripe account is not enabled to accept payments");
console.log(JSON.stringify({ stripeAccount: account.id, chargesEnabled: account.charges_enabled }));
const secrets = JSON.parse(await wrangler(["secret", "list"])) as { name: string }[];
let cursor = "";
const endpoints: { id: string; url: string; status: string; enabled_events: string[] }[] = [];
do {
	const page = await stripe(`webhook_endpoints?limit=100${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ""}`);
	endpoints.push(...page.data.filter((endpoint: { url: string }) => endpoint.url === webhookUrl));
	cursor = page.has_more ? page.data.at(-1).id : "";
} while (cursor);
if (!secrets.some(({ name }) => name === "STRIPE_WEBHOOK_SECRET")) {
	if (endpoints.length) throw new Error("A Stripe endpoint already exists for this URL. Install its signing secret as STRIPE_WEBHOOK_SECRET before retrying.");
	const endpoint = await stripe("webhook_endpoints", new URLSearchParams({
		url: webhookUrl,
		"enabled_events[0]": events[0],
		"enabled_events[1]": events[1],
		description: "EONMUN Astro artwork payment confirmation",
	}), "eonmun-astro-payment-webhook-v1");
	if (typeof endpoint.secret !== "string" || !endpoint.secret.startsWith("whsec_")) throw new Error("Stripe did not return a webhook signing secret");
	await wrangler(["secret", "put", "STRIPE_WEBHOOK_SECRET"], endpoint.secret);
	// An unpaid event verifies the deployed signing secret without changing inventory.
	const body = JSON.stringify({ id: "evt_eonmun_configuration_check", type: "checkout.session.completed", data: { object: { payment_status: "unpaid" } } });
	const timestamp = Math.floor(Date.now() / 1000);
	const signature = createHmac("sha256", endpoint.secret).update(`${timestamp}.${body}`).digest("hex");
	const verified = await fetch(webhookUrl, {
		method: "POST", redirect: "error",
		headers: { "content-type": "application/json", "stripe-signature": `t=${timestamp},v1=${signature}` }, body,
	});
	if (verified.status !== 200) throw new Error(`Webhook authentication probe returned HTTP ${verified.status}`);
	console.log(JSON.stringify({ webhookEndpoint: endpoint.id, signatureVerification: "passed", inventoryChanged: false }));
} else {
	if (!endpoints.some((endpoint) => endpoint.status === "enabled" && events.every((event) => endpoint.enabled_events.includes(event) || endpoint.enabled_events.includes("*")))) {
		throw new Error("Worker has a signing secret but Stripe has no enabled endpoint subscribed to the required payment events");
	}
	console.log("Worker webhook signing secret and Stripe payment subscription are already configured");
}
await wrangler(["secret", "put", "STRIPE_SECRET_KEY"], key);
console.log("Production Stripe checkout key configured");
