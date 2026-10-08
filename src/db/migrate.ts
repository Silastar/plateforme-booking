import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'node:path'
import postgres from 'postgres'

// Applique les migrations SQL du dossier drizzle/ au démarrage du serveur.
export async function runMigrations() {
  if (!process.env.DATABASE_URL) return
  const client = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} })
  try {
    await migrate(drizzle(client), { migrationsFolder: path.join(process.cwd(), 'drizzle') })
    console.info('[db] migrations à jour')
  } finally {
    await client.end()
  }
}
