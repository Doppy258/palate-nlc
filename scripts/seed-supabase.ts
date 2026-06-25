import 'dotenv/config'
import { seedDatabase } from '../server/db.ts'
import { supabaseKey, supabaseUrl } from '../server/supabase.ts'

const reset = process.argv.includes('--reset')

async function main() {
  if (!supabaseUrl() || !supabaseKey()) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
    process.exit(1)
  }
  console.log(`Seeding Supabase at ${supabaseUrl()}${reset ? ' (reset)' : ''}...`)
  const result = await seedDatabase({ reset })
  console.log(result.seeded ? 'Seed complete.' : 'Database already seeded; use --reset to wipe.')
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  if (message.includes('Could not find the table') || message.includes('schema cache')) {
    console.error('\nDatabase tables are missing. Apply the schema first:')
    console.error('1. Open https://supabase.com/dashboard/project/nzasnhmpcyxsgwpdxwni/sql/new')
    console.error('2. Paste the contents of supabase/schema.sql and run it')
    console.error('3. Re-run: npm run db:seed\n')
  }
  console.error(err)
  process.exit(1)
})
