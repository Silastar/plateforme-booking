import 'server-only'
import { and, asc, eq, ilike, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { band, bandMember } from '@/db/schema'

export type MemberView = {
  id: string
  name: string
  role: string | null
  isAdmin: boolean
  isEssential: boolean
  status: string
  hasAccount: boolean
  isMe: boolean
}

// Line-up complet d'un groupe (membres actifs, invités, demandes), pour la page d'édition.
export async function getLineup(bandId: string, viewerId: string): Promise<MemberView[]> {
  const rows = await db.query.bandMember.findMany({
    where: eq(bandMember.bandId, bandId),
    orderBy: [asc(bandMember.createdAt)],
    with: { user: { with: { musician: true } } },
  })
  return rows.map((r) => ({
    id: r.id,
    name: r.user?.musician?.stageName ?? r.user?.name ?? r.name ?? r.inviteEmail ?? '—',
    role: r.role,
    isAdmin: r.isAdmin,
    isEssential: r.isEssential,
    status: r.status,
    hasAccount: Boolean(r.userId),
    isMe: r.userId === viewerId,
  }))
}

// Invitations reçues et demandes envoyées par un musicien.
export async function getMusicianLinks(userId: string) {
  const rows = await db.query.bandMember.findMany({
    where: and(
      eq(bandMember.userId, userId),
      inArray(bandMember.status, ['invited', 'requested', 'active']),
    ),
    with: { band: true },
  })
  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    role: r.role,
    isAdmin: r.isAdmin,
    band: { id: r.band.id, name: r.band.name, slug: r.band.slug, city: r.band.city },
  }))
}

export async function searchBands(q: string) {
  const term = q.trim()
  if (term.length < 2) return []
  return db
    .select({ id: band.id, name: band.name, city: band.city, slug: band.slug })
    .from(band)
    .where(ilike(band.name, `%${term.replace(/[%_\\]/g, (c) => `\\${c}`)}%`))
    .orderBy(asc(band.name))
    .limit(10)
}
