import { expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { readFile, readdir } from "node:fs/promises";

const directory = new URL("../drizzle/", import.meta.url);
const cover = "https://r2.eonmun.com/1775752300190-44673548e9cb29c8.jpeg";

test("saved-color migration matches current covers and preserves newer saved colors", async () => {
 const client = createClient({ url: "file::memory:" });
 const apply = async (file: string) => {
  for (const statement of (await readFile(new URL(file, directory), "utf8")).split("--> statement-breakpoint")) {
   if (statement.trim()) await client.execute(statement);
  }
 };
 try {
  for (const file of (await readdir(directory)).filter(file => file.endsWith(".sql") && file < "0019").sort()) await apply(file);
  for (const id of [101, 102, 103, 104]) {
   await client.execute({ sql: "INSERT INTO artworks (id,title,slug,created_at,updated_at) VALUES (?, 'Cover', ?, 1, 1)", args: [id, `cover-${id}`] });
   await client.execute({ sql: "INSERT INTO artwork_images (artwork_id,url,is_default,created_at,updated_at) VALUES (?, ?, 1, 1, 1)", args: [id, id === 103 ? 'https://r2.eonmun.com/replaced.jpeg' : cover] });
  }
  await client.execute({ sql: "UPDATE artworks SET background_color='#112233', background_image_url=? WHERE id=102", args:[cover] });
  await client.execute("UPDATE artworks SET background_color='#445566', background_image_url='https://r2.eonmun.com/old.jpeg' WHERE id=104");
  // A previous cover remains in the gallery after it is replaced.
  await client.execute({ sql: "INSERT INTO artwork_images (artwork_id,url,is_default,created_at,updated_at) VALUES (103, ?, 0, 1, 1)", args:[cover] });
  const migration = "0019_backfill_artwork_background_colors.sql";
  await apply(migration);
  const saved = () => client.execute("SELECT id,background_color,background_image_url FROM artworks ORDER BY id");
  const first = (await saved()).rows;
  expect(first).toEqual([
   {id:101,background_color:'#76694e',background_image_url:cover},
   {id:102,background_color:'#112233',background_image_url:cover},
   {id:103,background_color:null,background_image_url:null},
   {id:104,background_color:'#76694e',background_image_url:cover},
  ]);
  await apply(migration);
  expect((await saved()).rows).toEqual(first);
 } finally { client.close(); }
});
