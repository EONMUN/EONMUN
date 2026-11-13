import { resolvePinterestBoardEnv } from "./pinterest-connection";
import { sql } from "drizzle-orm";
import { getDb, type Env } from "../db";
import { getAvailableArtworkById, getAvailableArtworkCatalog } from "../db/catalog";
import { catalogArtworkFields } from "./catalog-artwork";

export function isPinterestBoardConfigured(env: Env) {
 return Boolean(env.PINTEREST_BOARD_ACCESS_TOKEN && /^\d+$/.test(env.PINTEREST_BOARD_ID ?? ""));
}

async function request(env: Env, path: string, apiFetch: typeof fetch, body?: unknown) {
 const response = await apiFetch(`https://api.pinterest.com/v5${path}`, {
  method: body ? "POST" : "GET", redirect: "manual", signal: AbortSignal.timeout(20_000),
  headers: { Authorization: `Bearer ${env.PINTEREST_BOARD_ACCESS_TOKEN}`, ...(body ? { "Content-Type": "application/json" } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
 });
 if (!response.ok || response.status >= 300) throw new Error(`Pinterest board request failed (HTTP ${response.status})`);
 return response.json();
}

export function sameArtworkLink(link: string | undefined, expected: string) {
 try {
  const actual = new URL(link ?? ""); const target = new URL(expected);
  return actual.origin === target.origin && actual.pathname.replace(/\/$/, "") === target.pathname.replace(/\/$/, "");
 } catch { return false; }
}

export async function publishPinterestArtwork(env: Env, artworkId: number, apiFetch: typeof fetch = fetch, db = getDb(env), loadArtwork = getAvailableArtworkById) {
 env = await resolvePinterestBoardEnv(env, apiFetch);
 if (!isPinterestBoardConfigured(env)) return "not-connected";
 const artwork = await loadArtwork(env, artworkId);
 if (!artwork) return "unavailable";
 const claim = await db.run(sql`INSERT INTO pinterest_artwork_pins (artwork_id, board_id, state, created_at)
  VALUES (${artworkId}, ${env.PINTEREST_BOARD_ID!}, 'checking', ${Date.now()}) ON CONFLICT DO NOTHING`);
 if (!claim.rowsAffected) return "already-recorded";
 let posting = false;
 try {
  const fields = catalogArtworkFields(artwork);
  let bookmark: string | undefined;
  let pinId: string | undefined;
  const seen = new Set<string>();
  do {
   const query = new URLSearchParams({ page_size: "100" });
   if (bookmark) query.set("bookmark", bookmark);
   const page = await request(env, `/boards/${env.PINTEREST_BOARD_ID}/pins?${query}`, apiFetch) as { items?: { id: string; link?: string }[]; bookmark?: string };
   if (!Array.isArray(page.items)) throw new Error("Pinterest returned an invalid board page");
   pinId = page.items.find(pin => sameArtworkLink(pin.link, fields.link))?.id;
   bookmark = page.bookmark || undefined;
   if (bookmark && seen.has(bookmark)) throw new Error("Pinterest repeated a board page");
   if (bookmark) seen.add(bookmark);
  } while (bookmark && !pinId);
  if (!pinId) {
   // CRITICAL: persist before POST; an ambiguous response must never trigger another creation.
   await db.run(sql`UPDATE pinterest_artwork_pins SET state = 'posting' WHERE artwork_id = ${artworkId}`);
   posting = true;
   if (!await loadArtwork(env, artworkId)) {
    await db.run(sql`DELETE FROM pinterest_artwork_pins WHERE artwork_id = ${artworkId}`);
    return "unavailable";
   }
   const pin = await request(env, "/pins", apiFetch, {
    board_id: env.PINTEREST_BOARD_ID, title: fields.title.slice(0, 100), description: fields.description.slice(0, 800),
    link: fields.link, media_source: { source_type: "image_url", url: artwork.imageUrl },
   }) as { id?: string };
   if (!pin.id || !/^\d+$/.test(pin.id)) throw new Error("Pinterest did not return a Pin ID; check the board before retrying");
   pinId = pin.id;
  }
  await db.run(sql`UPDATE pinterest_artwork_pins SET state = 'published', pin_id = ${pinId} WHERE artwork_id = ${artworkId}`);
  return "published";
 } catch (error) {
  if (!posting) await db.run(sql`DELETE FROM pinterest_artwork_pins WHERE artwork_id = ${artworkId}`);
  throw error;
 }
}

export async function backfillPinterestBoard(env: Env) {
 env = await resolvePinterestBoardEnv(env);
 if (!isPinterestBoardConfigured(env)) return;
 const db = getDb(env);
 const recorded = await db.all<{ artwork_id: number }>(sql`SELECT artwork_id FROM pinterest_artwork_pins`);
 const ids = new Set(recorded.map(row => row.artwork_id));
 const next = (await getAvailableArtworkCatalog(env)).find(artwork => !ids.has(artwork.id));
 // One artwork per minute keeps the initial backfill within a modest publishing rate.
 if (next) await publishPinterestArtwork(env, next.id);
}
