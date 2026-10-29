const fs = require('fs');
const url = fs.readFileSync('.env', 'utf8').match(/DATABASE_URL=(.*)/)[1].trim().replace(/^['"]|['"]$/g, '');
const sql = require('postgres')(url);
(async () => {
  await sql`alter table issues add column if not exists location_name text`;
  console.log(await sql`select column_name from information_schema.columns where table_name = 'issues' and column_name = 'location_name'`);
  await sql.end();
})().catch((e) => { console.log('ERROR', e.message); process.exit(1); });

