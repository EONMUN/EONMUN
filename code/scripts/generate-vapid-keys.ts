// Generates a Web Push VAPID key pair for admin order alerts.
//
// The private key goes to stdout only, so it can be piped straight into
// `wrangler secret put` without appearing on screen or in a file:
//
//   bun run scripts/generate-vapid-keys.ts | bunx wrangler secret put VAPID_PRIVATE_KEY --name eonmun-astro
//
// The public key is printed to stderr for the `VAPID_PUBLIC_KEY` var.
import { base64UrlEncode } from "../src/lib/push/encoding";

const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
const publicKey = base64UrlEncode(await crypto.subtle.exportKey("raw", pair.publicKey) as ArrayBuffer);
const privateKey = (await crypto.subtle.exportKey("jwk", pair.privateKey)).d;
if (!privateKey) throw new Error("Could not export the VAPID private key");
if (process.stdout.isTTY) {
	console.error("Refusing to print the private key to a terminal. Pipe stdout into `wrangler secret put VAPID_PRIVATE_KEY`.");
	process.exit(1);
}
console.error(`VAPID_PUBLIC_KEY=${publicKey}`);
process.stdout.write(privateKey);
