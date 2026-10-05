import type { APIRoute } from "astro";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
import { subscribe, unsubscribe } from "../../../../lib/push/api";

export const prerender = false;
export const POST: APIRoute = ({ request }) => subscribe(request, getRuntimeEnv());
export const DELETE: APIRoute = ({ request }) => unsubscribe(request, getRuntimeEnv());
