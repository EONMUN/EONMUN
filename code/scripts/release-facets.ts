// One-release operations; remove after production acceptance.
import { createClient } from '@libsql/client';
const client = createClient({url:process.env.TURSO_DATABASE_URL!,authToken:process.env.TURSO_AUTH_TOKEN});
const tables = ['artworks','facets','artworks_to_facets','artwork_images','__drizzle_migrations'];
const mode = process.argv[2];
try {
 if (mode === 'backup') {
  const tx = await client.transaction('write');
  try {
   await tx.execute('CREATE TABLE release_108_backup (table_name TEXT NOT NULL, row_json TEXT NOT NULL)');
   for (const table of tables) {
    const rows = (await tx.execute(`SELECT * FROM "${table}"`)).rows;
    for (const row of rows) await tx.execute({sql:'INSERT INTO release_108_backup VALUES (?,?)',args:[table,JSON.stringify(row)]});
    console.log(`Backed up ${table}: ${rows.length} rows`);
   }
   await tx.commit();
  } catch(error) { await tx.rollback(); throw error; }
 } else if (mode === 'cleanup') {
  await client.execute('DROP TABLE release_108_backup');
 } else if (mode !== 'inspect') throw new Error('Expected inspect, backup, or cleanup');
 for (const table of tables) {
  console.log(table, 'columns:', (await client.execute(`PRAGMA table_info("${table}")`)).rows.map(row=>row.name));
  console.log(table, 'count:', (await client.execute(`SELECT count(*) AS count FROM "${table}"`)).rows[0].count);
 }
 console.log('Migration journal:',(await client.execute('SELECT * FROM __drizzle_migrations')).rows);
 const columns = (await client.execute('PRAGMA table_info(artworks)')).rows.map(row=>row.name);
 if(columns.includes('width')) console.log('Legacy measurements:',(await client.execute('SELECT slug,width,height,depth,dimension_unit FROM artworks')).rows);
 const facetColumns = (await client.execute('PRAGMA table_info(facets)')).rows.map(row=>row.name);
 if(facetColumns.includes('namespace')) console.log('Facet groups:',(await client.execute('SELECT namespace,key,count(*) AS count FROM facets GROUP BY namespace,key')).rows);
 else console.log('Legacy facet groups:',(await client.execute('SELECT type,count(*) AS count FROM facets GROUP BY type')).rows);
 const violations = (await client.execute('PRAGMA foreign_key_check')).rows;
 if(violations.length) throw new Error('Foreign key check failed');
 console.log('Foreign key check passed');
} finally {client.close();}
