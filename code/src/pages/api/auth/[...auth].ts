import type { APIRoute } from "astro";
import { Auth } from "@auth/core";

import { getAuthConfig } from "../../../lib/auth";
import { getRuntimeEnv } from "../../../lib/runtime-env";

export const prerender = false;

const handler: APIRoute = async ({ request }) =>
	Auth(request, getAuthConfig(getRuntimeEnv()));

export const GET = handler;
export const POST = handler;
