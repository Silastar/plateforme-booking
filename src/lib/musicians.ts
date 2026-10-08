import 'server-only'
import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { bandMember, musician } from '@/db/schema'

export async function getMusicianForEdit(userId: string) {
  return (await db.query.musician.findFirst({ where: eq(musician.userId, userId) })) ?? null
}

export async function getMusicianPage(slug: string) {
  const m = await db.query.musician.findFirst({ where: eq(musician.slug, slug) })
  if (!m) return null
  const memberships = await db.query.bandMember.findMany({
    where: and(eq(bandMember.userId, m.userId), eq(bandMember.status, 'active')),
    with: { band: true },
  })
  return { ...m, memberships }
}
