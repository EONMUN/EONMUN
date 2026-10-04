import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import sharp from 'sharp';
import { averageColor } from '../src/lib/artwork-color.ts';

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error('TURSO_DATABASE_URL required');
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const apply = process.argv.includes('--apply');
if (apply) await migrate(drizzle(client), { migrationsFolder: './drizzle' });
const rows = await client.execute(`SELECT a.id, i.url FROM artworks a JOIN artwork_images i ON i.artwork_id=a.id AND i.is_default=1
 WHERE a.background_color IS NULL OR a.background_image_url IS NULL OR a.background_image_url <> i.url`);
console.log(JSON.stringify({ pending: rows.rows.length, apply }));
let updated = 0;
const failed: string[] = [];
for (const row of rows.rows) {
 try {
 const source = new URL(String(row.url));
 if (source.origin !== 'https://r2.eonmun.com' || source.username || source.password) throw new Error('Unexpected media origin');
 const response = await fetch(source, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
 if (!response.ok) throw new Error(`Image fetch failed for artwork ${row.id}`);
 const pixels = await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize(16,16,{fit:'inside'}).flatten({background:'#ffffff'}).ensureAlpha().raw().toBuffer();
 const color = averageColor(pixels);
 if (apply) {
  const result = await client.execute({sql: `UPDATE artworks SET background_color=?, background_image_url=? WHERE id=?
   AND EXISTS (SELECT 1 FROM artwork_images WHERE artwork_id=artworks.id AND is_default=1 AND url=?)`, args:[color,String(row.url),row.id,String(row.url)]});
  updated += result.rowsAffected;
 }
 console.log(JSON.stringify({ artworkId: row.id, color }));
 } catch {
  failed.push(String(row.id));
  console.error(JSON.stringify({ artworkId: row.id, error: 'Cover color could not be calculated; retry after correcting the image' }));
 }
}
console.log(JSON.stringify({ updated, failed }));
if (failed.length) process.exitCode = 1;
client.close();
