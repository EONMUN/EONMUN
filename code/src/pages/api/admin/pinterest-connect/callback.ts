import type { APIRoute } from "astro";
import { requireAdminPage } from "../../../../lib/admin-guard";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
import { consumePinterestState, pinterestCallback, pinterestTokenRequest, storePinterestConnection } from "../../../../lib/pinterest-connection";
export const prerender = false;
export const GET: APIRoute = async ({request, url}) => {
 const env = getRuntimeEnv(); const guard = await requireAdminPage(request, env, "/admin/settings"); if ("response" in guard) return guard.response;
 const done = (status: string) => new Response(null, { status: 303, headers: { Location: `/admin/settings?pinterestConnection=${status}#pinterest`, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
 try {
  if (url.origin !== new URL(pinterestCallback).origin) return done("failed");
  const state = url.searchParams.get("state"); if (!state) return done("failed");
  const valid = await consumePinterestState(env, state, guard.session.user.email);
  if (!valid || url.searchParams.has("error") || !url.searchParams.get("code")) return done("failed");
  const tokens = await pinterestTokenRequest(env, new URLSearchParams({grant_type: "authorization_code", code: url.searchParams.get("code")!, redirect_uri: pinterestCallback, continuous_refresh: "true"}));
  await storePinterestConnection(env, tokens, guard.session.user.email);
  return done("connected");
 } catch { return done("failed"); }
};
