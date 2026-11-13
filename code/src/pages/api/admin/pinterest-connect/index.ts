import type { APIRoute } from "astro";
import { sql } from "drizzle-orm";
import { getDb } from "../../../../db";
import { requireAdminMutation, requireAdminPage } from "../../../../lib/admin-guard";
import { getRuntimeEnv } from "../../../../lib/runtime-env";
import { readPinterestConnection, listPinterestBoards, pinterestCallback, pinterestScopes } from "../../../../lib/pinterest-connection";
export const prerender = false;
const headers = { "Cache-Control": "no-store" };
export const GET: APIRoute = async ({request}) => {
 const env = getRuntimeEnv(); const guard = await requireAdminPage(request, env, "/admin/settings"); if ("response" in guard) return guard.response;
 try { return Response.json({boards: await listPinterestBoards(env), selectedBoardId: (await readPinterestConnection(env))?.board_id}, {headers}); }
 catch { return Response.json({error: "Could not load boards. Connect or reconnect Pinterest."}, {status: 502, headers}); }
};
export const POST: APIRoute = async ({request}) => {
 const env = getRuntimeEnv(); const guard = await requireAdminMutation(request, env); if ("response" in guard) return guard.response;
 try {
  const body = await request.json(); const db = getDb(env);
  if (body.action === "connect") {
   if (new URL(request.url).origin !== new URL(pinterestCallback).origin) return Response.json({error: "Connect Pinterest from production admin settings."}, {status: 400, headers});
   if (!env.PINTEREST_APP_ID || !env.PINTEREST_APP_SECRET || !env.AUTH_SECRET) throw new Error("Not configured");
   const state = crypto.randomUUID();
   await db.run(sql`DELETE FROM pinterest_oauth_states WHERE expires_at < ${Date.now()}`);
   await db.run(sql`INSERT INTO pinterest_oauth_states (state, owner, expires_at) VALUES (${state}, ${guard.session.user.email}, ${Date.now() + 600_000})`);
   const url = new URL("https://www.pinterest.com/oauth/");
   url.search = new URLSearchParams({ client_id: env.PINTEREST_APP_ID, redirect_uri: pinterestCallback, response_type: "code", scope: pinterestScopes.join(","), state }).toString();
   return Response.json({url: url.href}, {headers});
  }
  if (body.action === "select" && typeof body.boardId === "string") {
   const board = (await listPinterestBoards(env)).find(board => board.id === body.boardId);
   if (!board) return Response.json({error: "Choose a public board from the connected account."}, {status: 400, headers});
   await db.run(sql`UPDATE pinterest_connection SET board_id = ${board.id}, board_name = ${board.name} WHERE id = 1`);
   return Response.json({saved: true}, {headers});
  }
  if (body.action === "disconnect") { await db.run(sql`DELETE FROM pinterest_connection WHERE id = 1`); return Response.json({saved: true}, {headers}); }
  return Response.json({error: "Invalid action"}, {status: 400, headers});
 } catch { return Response.json({error: "Pinterest connection could not be updated. Reconnect and try again."}, {status: 502, headers}); }
};
