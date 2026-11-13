import { expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFile } from "node:fs/promises";
import { publishPinterestArtwork, sameArtworkLink } from "../src/lib/pinterest-board";

const artwork = { id: 1, slug: "piece", title: "Piece", description: "Art", imageUrl: "https://r2.eonmun.com/art.jpg", priceCents: 10000 };
const env = { PINTEREST_BOARD_ID: "123", PINTEREST_BOARD_ACCESS_TOKEN: "test-token" };

test.each(["existing", "create", "uncertain"])("board publication is duplicate-safe: %s", async mode => {
 const client = createClient({ url: ":memory:" });
 try {
  await client.execute("CREATE TABLE artworks (id INTEGER PRIMARY KEY)");
  await client.execute("INSERT INTO artworks VALUES (1)");
  await client.execute(await readFile(new URL("../drizzle/0022_pinterest_pins.sql", import.meta.url), "utf8"));
  const db = drizzle(client);
  let posts = 0; let pages = 0;
  const apiFetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
   expect(init?.redirect).toBe("manual");
   if (init?.method === "POST") {
    posts++;
    expect(JSON.parse(String(init.body)).board_id).toBe("123");
    if (mode === "uncertain") throw new Error("response lost");
    return Response.json({ id: "456" });
   }
   pages++;
   if (pages === 1) return Response.json({ items: [], bookmark: "next" });
   expect(String(url)).toContain("bookmark=next");
   return Response.json({ items: mode === "existing" ? [{ id: "789", link: "https://eonmun.com/artworks/piece/?source=pinterest" }] : [] });
  }) as typeof fetch;
  const load = async () => artwork;
  const results = await Promise.allSettled([publishPinterestArtwork(env, 1, apiFetch, db, load), publishPinterestArtwork(env, 1, apiFetch, db, load)]);
  expect(results.some(result => result.status === "fulfilled" && result.value === "already-recorded")).toBe(true);
  await publishPinterestArtwork(env, 1, apiFetch, db, load);
  expect(posts).toBe(mode === "existing" ? 0 : 1);
  const row = (await client.execute("SELECT * FROM pinterest_artwork_pins")).rows[0];
  expect(row.state).toBe(mode === "uncertain" ? "posting" : "published");
  expect(row.pin_id).toBe(mode === "uncertain" ? null : mode === "existing" ? "789" : "456");
 } finally { client.close(); }
});

test("artwork matching preserves the site and artwork identity", () => {
 expect(sameArtworkLink("https://evil.com/artworks/piece", "https://eonmun.com/artworks/piece")).toBe(false);
 expect(sameArtworkLink("https://eonmun.com/artworks/other", "https://eonmun.com/artworks/piece")).toBe(false);
});
