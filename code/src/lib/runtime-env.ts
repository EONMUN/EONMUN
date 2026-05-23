import { env as workerEnv } from "cloudflare:workers";
import type { Env } from "../db";

export function getRuntimeEnv(): Env {
	return workerEnv as Env;
}
