import type { APIRoute } from "astro";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
import { subscriptionStatus } from "../../../../lib/push/api";

export const prerender = false;
export const POST: APIRoute = ({ request }) => subscriptionStatus(request, getRuntimeEnv());
