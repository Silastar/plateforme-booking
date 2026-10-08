import 'server-only'
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm'

import { db } from '@/db'
import { application, band, gig, organization, user } from '@/db/schema'

import { bandAvailability } from './availability'
import { todayIso } from './calendar'
import { matchGig, type Match } from './gig-rules'

const withPlace = {
  venue: true,
  organization: { with: { owner: { columns: { status: true } } } },
} as const

/* ---------- Côté orga ---------- */

export async function getOrgaGigs(organizationId: string) {
  return db.query.gig.findMany({
    where: eq(gig.organizationId, organizationId),
    orderBy: [asc(gig.day)],
    with: {
      venue: true,
      applications: {
        orderBy: [desc(application.createdAt)],
        with: { band: true },
      },
    },
  })
}

export async function getGigForOrga(gigId: string, userId: string) {
  const g = await db.query.gig.findFirst({
    where: eq(gig.id, gigId),
    with: { organization: true },
  })
  return g && g.organization.ownerId === userId ? g : null
}

// Groupes dont le soir est vraiment dispo (coché, aucun membre indispensable pris).
export async function bandsOpenOn(bandIds: string[], day: string): Promise<Set<string>> {
  const states = await Promise.all(bandIds.map((id) => bandAvailability(id, [day])))
  return new Set(bandIds.filter((_, i) => states[i][0]?.state === 'open'))
}

// Groupes compatibles avec une date (genre, argent, soir dispo), sans ceux qui ont déjà candidaté.
export async function compatibleBands(
  g: {
    id: string
    day: string
    genres: string[]
    budgetMin: number | null
    budgetMax: number | null
  },
  limit = 5,
) {
  const genres = sql`${`{${g.genres.map((x) => `"${x}"`).join(',')}}`}::text[]`
  const low = g.budgetMin ?? g.budgetMax
  const high = g.budgetMax ?? g.budgetMin
  const money =
    low === null || high === null
      ? sql`true`
      : sql`(coalesce(${band.feeMin}, ${band.feeMax}) is null
          or (coalesce(${band.feeMin}, ${band.feeMax}) <= ${high}
              and ${low} <= coalesce(${band.feeMax}, ${band.feeMin})))`
  const rows = await db
    .select({ id: band.id, name: band.name, slug: band.slug, city: band.city })
    .from(band)
    .where(
      and(
        g.genres.length
          ? sql`(${band.mainGenre} = any(${genres}) or ${band.genres} && ${genres})`
          : sql`true`,
        money,
        sql`exists (select 1 from band_availability a where a.band_id = ${band.id} and a.day = ${g.day})`,
        sql`not exists (
          select 1 from band_member m join unavailability u on u.user_id = m.user_id and u.day = ${g.day}
          where m.band_id = ${band.id} and m.status = 'active' and m.is_essential)`,
        sql`not exists (select 1 from application ap where ap.band_id = ${band.id} and ap.gig_id = ${g.id})`,
      ),
    )
    .orderBy(asc(band.name))
  return { count: rows.length, bands: rows.slice(0, limit) }
}

/* ---------- Côté groupes ---------- */

// Dates en annonce ouverte, à venir, d'orgas validées.
export async function getOpenGigs(limit = 60) {
  const rows = await db
    .select({ id: gig.id })
    .from(gig)
    .innerJoin(organization, eq(organization.id, gig.organizationId))
    .innerJoin(user, eq(user.id, organization.ownerId))
    .where(
      and(
        eq(gig.status, 'open'),
        eq(gig.visibility, 'open'),
        gte(gig.day, todayIso()),
        eq(user.status, 'active'),
      ),
    )
    .orderBy(asc(gig.day))
    .limit(limit)
  if (rows.length === 0) return []
  return db.query.gig.findMany({
    where: inArray(
      gig.id,
      rows.map((r) => r.id),
    ),
    orderBy: [asc(gig.day)],
    with: withPlace,
  })
}

export async function getGigPage(id: string) {
  return (
    (await db.query.gig.findFirst({
      where: eq(gig.id, id),
      with: { ...withPlace, organization: { with: { owner: true } } },
    })) ?? null
  )
}

// Une date est visible de tous si elle est en annonce ouverte et que l'orga est validée ;
// sinon seulement de l'orga elle-même et de l'équipe.
export function canSeeGig(
  g: { visibility: string; organization: { ownerId: string; owner: { status: string } } },
  viewer: { id: string; role?: string | null } | null,
) {
  if (viewer && (viewer.id === g.organization.ownerId || viewer.role === 'admin')) return true
  return g.visibility === 'open' && g.organization.owner.status === 'active'
}

// Compatibilité de chaque date avec les groupes que l'utilisateur administre (le meilleur groupe gagne).
export async function matchForBands(
  gigs: {
    id: string
    day: string
    genres: string[]
    budgetMin: number | null
    budgetMax: number | null
  }[],
  bands: {
    id: string
    mainGenre: string
    genres: string[]
    feeMin: number | null
    feeMax: number | null
  }[],
): Promise<Map<string, Match>> {
  const out = new Map<string, Match>()
  if (bands.length === 0) return out
  for (const g of gigs) {
    const open = await bandsOpenOn(
      bands.map((b) => b.id),
      g.day,
    )
    const matches = bands.map((b) => matchGig(g, b, open.has(b.id)))
    out.set(g.id, matches.find((m) => m.fits) ?? matches[0])
  }
  return out
}

export async function getBandApplications(bandIds: string[]) {
  if (bandIds.length === 0) return []
  return db.query.application.findMany({
    where: inArray(application.bandId, bandIds),
    orderBy: [desc(application.createdAt)],
    with: { band: true, gig: { with: withPlace } },
  })
}
