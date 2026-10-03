// One-release operations; remove after production acceptance.
import { createClient } from '@libsql/client';
const client = createClient({url:process.env.TURSO_DATABASE_URL!,authToken:process.env.TURSO_AUTH_TOKEN});
const tables = ['artworks','facets','artworks_to_facets','artwork_images','__drizzle_migrations'];
const mode = process.argv[2];
try {
 if (mode === 'backup') {
  const tx = await client.transaction('write');
  try {
   await tx.execute('CREATE TABLE release_dimensions_backup (table_name TEXT NOT NULL, row_json TEXT NOT NULL)');
   for (const table of tables) {
    const rows = (await tx.execute(`SELECT * FROM "${table}"`)).rows;
    for (const row of rows) await tx.execute({sql:'INSERT INTO release_dimensions_backup VALUES (?,?)',args:[table,JSON.stringify(row)]});
    console.log(`Backed up ${table}: ${rows.length} rows`);
   }
   await tx.commit();
  } catch(error) { await tx.rollback(); throw error; }
 } else if (mode === 'cleanup') {
  await client.execute('DROP TABLE release_dimensions_backup');
 } else if (mode !== 'inspect') throw new Error('Expected inspect, backup, or cleanup');
 for (const table of tables) {
  console.log(table, 'columns:', (await client.execute(`PRAGMA table_info("${table}")`)).rows.map(row=>row.name));
  console.log(table, 'count:', (await client.execute(`SELECT count(*) AS count FROM "${table}"`)).rows[0].count);
 }
 console.log('Migration journal:',(await client.execute('SELECT * FROM __drizzle_migrations')).rows);
 const columns = (await client.execute('PRAGMA table_info(artworks)')).rows.map(row=>row.name);
 if(columns.includes('width')) console.log('Typed measurements:',(await client.execute('SELECT slug,width,height,depth,dimension_unit FROM artworks')).rows);
 const facetColumns = (await client.execute('PRAGMA table_info(facets)')).rows.map(row=>row.name);
 if(facetColumns.includes('namespace')) console.log('Facet groups:',(await client.execute('SELECT namespace,key,count(*) AS count FROM facets GROUP BY namespace,key')).rows);
 else console.log('Legacy facet groups:',(await client.execute('SELECT type,count(*) AS count FROM facets GROUP BY type')).rows);
 const violations = (await client.execute('PRAGMA foreign_key_check')).rows;
 if(violations.length) throw new Error('Foreign key check failed');
 console.log('Foreign key check passed');
 if (columns.includes('width') && mode !== 'cleanup') {
  const backupExists = (await client.execute("SELECT name FROM sqlite_master WHERE name='release_dimensions_backup'")).rows.length;
  if (backupExists) {
   const saved = (await client.execute("SELECT table_name,row_json FROM release_dimensions_backup")).rows;
   const originalFacets = new Map(saved.filter(r=>r.table_name==='facets').map(r=>{const f=JSON.parse(String(r.row_json));return [f.id,f];}));
   const current = new Map((await client.execute('SELECT id,width,height,depth,dimension_unit FROM artworks')).rows.map(r=>[r.id,r]));
   let verified = 0;
   for (const row of saved.filter(r=>r.table_name==='artworks_to_facets')) {
    const link=JSON.parse(String(row.row_json)), facet=originalFacets.get(link.facet_id);
    if(facet?.namespace !== 'artwork' || !['width','height','depth','dimension-unit'].includes(facet.key)) continue;
    const key=facet.key==='dimension-unit'?'dimension_unit':facet.key;
    const expected=key==='dimension_unit'?facet.value:Number(facet.value);
    if(current.get(link.artwork_id)?.[key] !== expected) throw new Error('Measurement preservation check failed');
    verified++;
   }
   console.log('Preserved measurement and unit assignments:',verified);
  }
 }
} finally {client.close();}
