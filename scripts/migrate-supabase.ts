import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql')

async function main() {
  const url = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL
  if (!url) {
    console.error(
      'Set SUPABASE_DB_URL (Supabase → Settings → Database → Connection string → URI) then rerun.',
    )
    console.error('Or paste supabase/schema.sql into the Supabase SQL editor and run npm run db:seed')
    process.exit(1)
  }

  const sql = readFileSync(schemaPath, 'utf8')
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('Applying schema...')
  await client.query(sql)
  await client.end()
  console.log('Schema applied.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
