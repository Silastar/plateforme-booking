import { NextResponse } from 'next/server'

import { sql } from '@/db'

export const dynamic = 'force-dynamic'

// Sonde pour Docker / Unraid : l'app répond et la base PostgreSQL est joignable.
export async function GET() {
  try {
    await sql`select 1`
    return NextResponse.json({ ok: true, db: 'up' })
  } catch {
    return NextResponse.json({ ok: false, db: 'down' }, { status: 503 })
  }
}
