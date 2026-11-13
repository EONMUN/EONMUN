import { sql } from "drizzle-orm";
import { getDb, type Env } from "../db";
import { SITE_URL } from "../consts";

export const pinterestCallback = new URL("/api/admin/pinterest-connect/callback", SITE_URL).href;
export const pinterestScopes = ["boards:read", "pins:read", "pins:write"];
interface Tokens { access_token: string; refresh_token: string; expires_in: number; scope?: string; }
interface Connection { tokens: string; expires_at: number; board_id: string | null; board_name: string | null; authorized_by: string; }

async function key(secret: string) {
 const bytes = new TextEncoder().encode(`eonmun:pinterest:${secret}`);
 return crypto.subtle.importKey("raw", await crypto.subtle.digest("SHA-256", bytes), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function sealPinterestTokens(value: string, secret: string) {
 const iv = crypto.getRandomValues(new Uint8Array(12));
 const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(secret), new TextEncoder().encode(value));
 return btoa(String.fromCharCode(...iv, ...new Uint8Array(encrypted)));
}
export async function openPinterestTokens(value: string, secret: string) {
 const bytes = Uint8Array.from(atob(value), c => c.charCodeAt(0));
 const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, await key(secret), bytes.slice(12));
 return new TextDecoder().decode(decrypted);
}
function secret(env: Env) { if (!env.AUTH_SECRET) throw new Error("Admin encryption is not configured"); return env.AUTH_SECRET; }

export async function pinterestTokenRequest(env: Env, body: URLSearchParams, apiFetch: typeof fetch = fetch): Promise<Tokens> {
 if (!env.PINTEREST_APP_ID || !env.PINTEREST_APP_SECRET) throw new Error("Pinterest app is not configured");
 const response = await apiFetch("https://api.pinterest.com/v5/oauth/token", {
  method: "POST", redirect: "manual", signal: AbortSignal.timeout(20_000),
  headers: { Authorization: `Basic ${btoa(`${env.PINTEREST_APP_ID}:${env.PINTEREST_APP_SECRET}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body,
 });
 if (!response.ok) throw new Error("Pinterest authorization failed. Reconnect Pinterest.");
 const tokens = await response.json() as Tokens;
 if (!tokens.access_token || !tokens.refresh_token || !Number.isFinite(tokens.expires_in) || tokens.expires_in <= 0) throw new Error("Pinterest returned incomplete authorization");
 return tokens;
}
export async function readPinterestConnection(env: Env, db = getDb(env)) {
 return (await db.all<Connection>(sql`SELECT * FROM pinterest_connection WHERE id = 1`))[0] ?? null;
}
export async function storePinterestConnection(env: Env, tokens: Tokens, owner: string, db = getDb(env)) {
 const granted = new Set((tokens.scope ?? "").split(/[ ,]+/));
 if (!pinterestScopes.every(scope => granted.has(scope))) throw new Error("Pinterest did not grant all posting permissions. Reconnect and approve them.");
 const encrypted = await sealPinterestTokens(JSON.stringify(tokens), secret(env));
 // Reauthorization requires choosing a board again, so a different account cannot inherit the old destination.
 await db.run(sql`INSERT INTO pinterest_connection (id, tokens, expires_at, authorized_by) VALUES (1, ${encrypted}, ${Date.now() + tokens.expires_in * 1000}, ${owner})
  ON CONFLICT(id) DO UPDATE SET tokens = excluded.tokens, expires_at = excluded.expires_at, authorized_by = excluded.authorized_by, refresh_until = 0, board_id = NULL, board_name = NULL`);
}
export async function resolvePinterestBoardEnv(env: Env, apiFetch: typeof fetch = fetch, database?: ReturnType<typeof getDb>): Promise<Env> {
 if (!env.AUTH_SECRET) return env;
 const db = database ?? getDb(env); const connection = await readPinterestConnection(env, db);
 if (!connection) return env;
 let tokens = JSON.parse(await openPinterestTokens(connection.tokens, secret(env))) as Tokens;
 if (connection.expires_at < Date.now() + 7 * 24 * 3600_000) {
  const claimed = await db.run(sql`UPDATE pinterest_connection SET refresh_until = ${Date.now() + 60_000} WHERE id = 1 AND tokens = ${connection.tokens} AND refresh_until < ${Date.now()}`);
  if (!claimed.rowsAffected) throw new Error("Pinterest connection is refreshing. Try again shortly.");
  try {
  tokens = await pinterestTokenRequest(env, new URLSearchParams({ grant_type: "refresh_token", refresh_token: tokens.refresh_token }), apiFetch);
  const encrypted = await sealPinterestTokens(JSON.stringify(tokens), secret(env));
  await db.run(sql`UPDATE pinterest_connection SET tokens = ${encrypted}, refresh_until = 0, expires_at = ${Date.now() + tokens.expires_in * 1000} WHERE id = 1 AND tokens = ${connection.tokens}`);
  } catch (error) { await db.run(sql`UPDATE pinterest_connection SET refresh_until = 0 WHERE id = 1 AND tokens = ${connection.tokens}`); throw error; }
 }
 return { ...env, PINTEREST_BOARD_ID: connection.board_id ?? undefined, PINTEREST_BOARD_ACCESS_TOKEN: tokens.access_token };
}
export async function listPinterestBoards(env: Env, apiFetch: typeof fetch = fetch) {
 const resolved = await resolvePinterestBoardEnv(env, apiFetch);
 if (!resolved.PINTEREST_BOARD_ACCESS_TOKEN) throw new Error("Connect Pinterest first");
 const boards: { id: string; name: string }[] = []; let bookmark = ""; const seen = new Set<string>();
 do {
  const query = new URLSearchParams({ page_size: "100" }); if (bookmark) query.set("bookmark", bookmark);
  const response = await apiFetch(`https://api.pinterest.com/v5/boards?${query}`, { redirect: "manual", signal: AbortSignal.timeout(20_000), headers: { Authorization: `Bearer ${resolved.PINTEREST_BOARD_ACCESS_TOKEN}` } });
  if (!response.ok) throw new Error("Could not load Pinterest boards. Reconnect Pinterest if access has expired.");
  const page = await response.json() as { items?: { id: string; name: string; privacy?: string }[]; bookmark?: string };
  if (!Array.isArray(page.items)) throw new Error("Pinterest returned an invalid board list");
  boards.push(...page.items.filter(board => /^\d+$/.test(board.id) && board.privacy === "PUBLIC").map(({id, name}) => ({id, name})));
  bookmark = page.bookmark ?? "";
  if (bookmark && seen.has(bookmark)) throw new Error("Pinterest repeated a board page");
  if (bookmark) seen.add(bookmark);
 } while (bookmark);
 return boards;
}

export async function consumePinterestState(env: Env, state: string, owner: string, db = getDb(env)) {
 const rows = await db.all(sql`DELETE FROM pinterest_oauth_states WHERE state = ${state} AND owner = ${owner} AND expires_at > ${Date.now()} RETURNING state`);
 return rows.length === 1;
}
