import 'server-only'
import { and, eq, gte, inArray, isNotNull, lte } from 'drizzle-orm'

import { db } from '@/db'
import { bandAvailability as bandOpenDay, bandMember, tour, unavailability } from '@/db/schema'

import { combineBandDays, type BandDay } from './calendar'

// Dispos d'un groupe sur une liste de jours (dans l'ordre), à partir de la base.
export async function bandAvailability(bandId: string, days: string[]): Promise<BandDay[]> {
  if (days.length === 0) return []
  const from = days[0]
  const to = days[days.length - 1]

  const [open, members, tours] = await Promise.all([
    db
      .select({ day: bandOpenDay.day })
      .from(bandOpenDay)
      .where(
        and(eq(bandOpenDay.bandId, bandId), gte(bandOpenDay.day, from), lte(bandOpenDay.day, to)),
      ),
    db.query.bandMember.findMany({
      where: and(
        eq(bandMember.bandId, bandId),
        eq(bandMember.status, 'active'),
        eq(bandMember.isEssential, true),
        isNotNull(bandMember.userId),
      ),
      with: { user: { with: { musician: true } } },
    }),
    db
      .select({ startDate: tour.startDate, endDate: tour.endDate, region: tour.region })
      .from(tour)
      .where(and(eq(tour.bandId, bandId), lte(tour.startDate, to), gte(tour.endDate, from))),
  ])

  const userIds = members.map((m) => m.userId!).filter(Boolean)
  const personal = userIds.length
    ? await db
        .select({ userId: unavailability.userId, day: unavailability.day })
        .from(unavailability)
        .where(
          and(
            inArray(unavailability.userId, userIds),
            gte(unavailability.day, from),
            lte(unavailability.day, to),
          ),
        )
    : []

  return combineBandDays(days, {
    bandOpen: new Set(open.map((o) => o.day)),
    essentialMembers: members.map((m) => ({
      name: m.user?.musician?.stageName ?? m.user?.name ?? '—',
      busy: new Set(personal.filter((p) => p.userId === m.userId).map((p) => p.day)),
    })),
    tours,
  })
}

export async function musicianBusyDays(userId: string, from: string, to: string) {
  return db
    .select({ day: unavailability.day, note: unavailability.note })
    .from(unavailability)
    .where(
      and(
        eq(unavailability.userId, userId),
        gte(unavailability.day, from),
        lte(unavailability.day, to),
      ),
    )
}

export async function bandTours(bandId: string) {
  return db.select().from(tour).where(eq(tour.bandId, bandId)).orderBy(tour.startDate)
}
