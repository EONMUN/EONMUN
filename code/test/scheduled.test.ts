import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { ADMIN_PUSH_CRON, GOOGLE_MERCHANT_CRON, runScheduled } from "../src/lib/scheduled";

test("the minute cron delivers alerts without running the weekly Google sync", async () => {
	const ran: string[] = [];
	const jobs = { googleMerchant: async () => { ran.push("google"); }, adminPush: async () => { ran.push("push"); } };
	await runScheduled(ADMIN_PUSH_CRON, {}, jobs);
	await runScheduled(ADMIN_PUSH_CRON, {}, jobs);
	expect(ran).toEqual(["push", "push"]);
	await runScheduled(GOOGLE_MERCHANT_CRON, {}, jobs);
	expect(ran).toEqual(["push", "push", "google"]);
});

test("the routed expressions match the Worker triggers", async () => {
	const config = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
	const crons = JSON.parse(/"crons":\s*(\[[^\]]*\])/.exec(config)![1]);
	expect(crons.sort()).toEqual([ADMIN_PUSH_CRON, GOOGLE_MERCHANT_CRON].sort());
});
