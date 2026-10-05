import { handle } from "@astrojs/cloudflare/handler";
import type { Env } from "./db";
import { runScheduled } from "./lib/scheduled";

export default {
	fetch: handle,
	async scheduled(controller, env) {
		await runScheduled(controller.cron, env);
	},
} satisfies ExportedHandler<Env>;
