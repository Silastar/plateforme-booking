import 'server-only'
import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { band, bandMember } from '@/db/schema'

// Groupe modifiable par cet utilisateur (admin actif du line-up), sinon null.
export async function getBandForEdit(bandId: string, userId: string) {
  const m = await db.query.bandMember.findFirst({
    where: and(
      eq(bandMember.bandId, bandId),
      eq(bandMember.userId, userId),
      eq(bandMember.isAdmin, true),
      eq(bandMember.status, 'active'),
    ),
    with: { band: true },
  })
  return m?.band ?? null
}

export async function getAdminBands(userId: string) {
  const rows = await db.query.bandMember.findMany({
    where: and(
      eq(bandMember.userId, userId),
      eq(bandMember.isAdmin, true),
      eq(bandMember.status, 'active'),
    ),
    with: { band: true },
  })
  return rows.map((r) => r.band)
}

export async function getBandPage(slug: string) {
  const b = await db.query.band.findFirst({
    where: eq(band.slug, slug),
    with: {
      members: {
        where: eq(bandMember.status, 'active'),
        orderBy: [asc(bandMember.createdAt)],
        with: { user: { with: { musician: true } } },
      },
    },
  })
  return b ?? null
}
