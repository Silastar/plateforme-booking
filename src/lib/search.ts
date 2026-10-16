import 'server-only'
import { and, isNotNull, sql } from 'drizzle-orm'

import { db } from '@/db'
import { band, type VenueGear } from '@/db/schema'

import { GENRES } from './genres'
import { distanceKm, hasPoint, reaches, type Point } from './geo'
import { matchGig, type Match, type MatchBand } from './gig-rules'
import { bandsOpenOn, getOpenGigs, gigPoint } from './gigs'
import { compareWithVenue } from './rider-core'
import { itemData, loadBandRiders } from './riders'

export const RADII = [25, 50, 100, 200] as const
export const SORTS = ['relevance', 'distance', 'fee', 'name'] as const
export type Sort = (typeof SORTS)[number]

const isGenre = (g: string): g is (typeof GENRES)[number] =>
  (GENRES as readonly string[]).includes(g)
export const cleanGenres = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? [v] : []).filter(isGenre)

const genresSql = (gs: string[]) => sql`${`{${gs.map((x) => `"${x}"`).join(',')}}`}::text[]`

/* ---------- Groupes (côté orga) ---------- */

export type BandQuery = {
  genres: string[]
  point: Point | null
  maxKm: number | null
  day: string | null
  freeOnly: boolean
  budgetMin: number | null
  budgetMax: number | null
  gear: VenueGear | null
  sort: Sort
}

export async function searchBands(q: BandQuery) {
  const low = q.budgetMin ?? q.budgetMax
  const high = q.budgetMax ?? q.budgetMin
  const rows = await db
    .select()
    .from(band)
    .where(
      and(
        isNotNull(band.slug),
        q.genres.length
          ? sql`(${band.mainGenre} = any(${genresSql(q.genres)}) or ${band.genres} && ${genresSql(q.genres)})`
          : undefined,
        low !== null && high !== null
          ? sql`(coalesce(${band.feeMin}, ${band.feeMax}) is null
              or (coalesce(${band.feeMin}, ${band.feeMax}) <= ${high}
                  and ${low} <= coalesce(${band.feeMax}, ${band.feeMin})))`
          : undefined,
      ),
    )

  let list = rows.map((b) => {
    const distance = q.point && hasPoint(b) ? distanceKm(b, q.point) : null
    return {
      band: b,
      distance,
      travels: reaches(b, q.point),
      free: null as boolean | null,
      gear: null as null | { ok: number; total: number; missing: number },
    }
  })
  // Seuls les groupes qui se déplacent jusqu'ici ; un groupe sans rayon reste, signalé « zone non précisée ».
  if (q.point) list = list.filter((r) => r.travels !== false)
  if (q.maxKm !== null) list = list.filter((r) => r.distance !== null && r.distance <= q.maxKm!)

  if (q.day) {
    const open = await bandsOpenOn(
      list.map((r) => r.band.id),
      q.day,
    )
    for (const r of list) r.free = open.has(r.band.id)
    if (q.freeOnly) list = list.filter((r) => r.free)
  }

  // Matériel : la meilleure configuration du groupe face au lieu de l'orga.
  if (q.gear) {
    for (const r of list) {
      const { riders, defs } = await loadBandRiders(r.band.id)
      const best = riders
        .map((x) => compareWithVenue(x.items.map(itemData), defs, q.gear!))
        .filter((c) => c.known)
        .map((c) => ({
          ok: c.ok,
          total: c.total,
          missing: c.checks.filter((k) => k.status === 'missing').length,
        }))
        .sort((a, b) => a.missing - b.missing || b.ok / b.total - a.ok / a.total)[0]
      r.gear = best ?? null
    }
    list = list.filter((r) => r.gear && r.gear.missing === 0)
  }

  const score = (r: (typeof list)[number]) => {
    let s = 0
    const all = [r.band.mainGenre, ...r.band.genres]
    if (q.genres.includes(r.band.mainGenre)) s += 2
    s += all.filter((g) => q.genres.includes(g)).length
    if (r.free) s += 3
    if (r.travels) s += 1
    if (r.gear) s += 1
    if (r.distance !== null) s -= r.distance / 60
    return s
  }
  const fee = (r: (typeof list)[number]) =>
    r.band.feeMin ?? r.band.feeMax ?? Number.MAX_SAFE_INTEGER
  const dist = (r: (typeof list)[number]) => r.distance ?? Number.MAX_SAFE_INTEGER
  const sorters: Record<Sort, (a: (typeof list)[number], b: (typeof list)[number]) => number> = {
    relevance: (a, b) => score(b) - score(a),
    distance: (a, b) => dist(a) - dist(b),
    fee: (a, b) => fee(a) - fee(b),
    name: (a, b) => a.band.name.localeCompare(b.band.name),
  }
  return list.sort(sorters[q.sort])
}

/* ---------- Dates ouvertes (côté groupes) ---------- */

export type GigQuery = {
  genres: string[]
  month: string | null
  point: Point | null
  maxKm: number | null
  budgetMin: number | null
  fitsOnly: boolean
}

export async function searchGigs(q: GigQuery, bands: (MatchBand & { id: string })[]) {
  const gigs = await getOpenGigs(200)
  const rows: { gig: (typeof gigs)[number]; distance: number | null; match: Match | null }[] = []
  for (const g of gigs) {
    if (q.month && !g.day.startsWith(q.month)) continue
    if (q.genres.length && g.genres.length && !g.genres.some((x) => q.genres.includes(x))) continue
    if (
      q.budgetMin !== null &&
      (g.budgetMax ?? g.budgetMin) !== null &&
      (g.budgetMax ?? g.budgetMin)! < q.budgetMin
    )
      continue
    const point = gigPoint(g)
    const distance = q.point && hasPoint(point) ? distanceKm(q.point, point) : null
    if (q.maxKm !== null && (distance === null || distance > q.maxKm)) continue
    let match: Match | null = null
    if (bands.length) {
      const open = await bandsOpenOn(
        bands.map((b) => b.id),
        g.day,
      )
      const matches = bands.map((b) => matchGig({ ...g, point }, b, open.has(b.id)))
      match = matches.find((m) => m.fits) ?? matches[0]
    }
    if (q.fitsOnly && !match?.fits) continue
    rows.push({ gig: g, distance, match })
  }
  // Celles qui collent d'abord, puis par date.
  return rows.sort(
    (a, b) =>
      Number(b.match?.fits ?? 0) - Number(a.match?.fits ?? 0) || a.gig.day.localeCompare(b.gig.day),
  )
}
