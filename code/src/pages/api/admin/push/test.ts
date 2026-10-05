import type { APIRoute } from "astro";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
import { sendTest } from "../../../../lib/push/api";

export const prerender = false;
export const POST: APIRoute = ({ request }) => sendTest(request, getRuntimeEnv());
