import { z } from 'zod'

import { addDays, iso, weekdayIndex } from './calendar'
import { GENRES } from './genres'

export const GIG_FORMATS = ['headline', 'support', 'bill'] as const
export const GIG_INCLUDES = ['meal', 'drinks', 'lodging', 'travel'] as const
export const SET_LENGTHS = [30, 45, 60, 75, 90, 120] as const
export const REPEAT_MODES = ['none', 'weekly', 'monthly'] as const
export const MAX_REPEAT = 12

/* ---------- Répétition ---------- */

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate()

// Même jour de la semaine, à la même place dans le mois (« 2e vendredi », « dernier samedi »).
function sameSlotInMonth(day: string, monthsAhead: number): string {
  const year = Number(day.slice(0, 4))
  const month = Number(day.slice(5, 7))
  const date = Number(day.slice(8, 10))
  const weekday = weekdayIndex(day)
  const last = date + 7 > daysInMonth(year, month)
  const nth = Math.ceil(date / 7)
  const index = year * 12 + (month - 1) + monthsAhead
  const y = Math.floor(index / 12)
  const m = (index % 12) + 1
  const firstWeekday = weekdayIndex(iso(y, m, 1))
  const firstMatch = 1 + ((weekday - firstWeekday + 7) % 7)
  let d = firstMatch + (nth - 1) * 7
  if (last) {
    d = firstMatch
    while (d + 7 <= daysInMonth(y, m)) d += 7
  }
  return iso(y, m, d)
}

// Toutes les dates d'une série, la première comprise.
export function repeatDays(
  day: string,
  mode: (typeof REPEAT_MODES)[number],
  count: number,
): string[] {
  if (mode === 'none' || count <= 1) return [day]
  return Array.from({ length: Math.min(count, MAX_REPEAT) }, (_, i) =>
    mode === 'weekly' ? addDays(day, i * 7) : sameSlotInMonth(day, i),
  )
}

/* ---------- Compatibilité ---------- */

export type MatchBand = {
  mainGenre: string
  genres: string[]
  feeMin: number | null
  feeMax: number | null
}
export type MatchGig = { genres: string[]; budgetMin: number | null; budgetMax: number | null }
export type Match = {
  genre: boolean
  // null : une des deux fourchettes manque, on ne peut pas trancher
  money: boolean | null
  // dispo coché par le groupe et aucun membre indispensable pris
  night: boolean
  fits: boolean
}

// Trois des quatre critères du cahier des charges ; le lieu (zone du groupe) viendra avec la recherche.
export function matchGig(g: MatchGig, b: MatchBand, nightOpen: boolean): Match {
  const bandGenres = new Set([b.mainGenre, ...b.genres])
  const genre = g.genres.length === 0 || g.genres.some((x) => bandGenres.has(x))
  const lowB = g.budgetMin ?? g.budgetMax
  const highB = g.budgetMax ?? g.budgetMin
  const lowF = b.feeMin ?? b.feeMax
  const highF = b.feeMax ?? b.feeMin
  const money =
    lowB === null || highB === null || lowF === null || highF === null
      ? null
      : lowB <= highF && lowF <= highB
  return { genre, money, night: nightOpen, fits: genre && money !== false && nightOpen }
}

/* ---------- Formulaire ---------- */

const optInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number('number').int('number').min(min, 'number').max(max, 'number').optional(),
  )
const time = z
  .string()
  .trim()
  .refine((v) => v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), 'time')

export const gigSchema = z
  .object({
    venueId: z.string(),
    day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'required'),
    loadIn: time,
    setStart: time,
    curfew: time,
    repeat: z.enum(REPEAT_MODES),
    repeatCount: optInt(2, MAX_REPEAT),
    genres: z.array(z.enum(GENRES)).min(1, 'required').max(6, 'tooMany'),
    format: z.enum(GIG_FORMATS, 'required'),
    bandsCount: optInt(1, 10),
    setLength: optInt(10, 300),
    budgetMin: optInt(0, 1_000_000),
    budgetMax: optInt(0, 1_000_000),
    includes: z.array(z.enum(GIG_INCLUDES)),
    visibility: z.enum(['open', 'invite']),
    note: z.string().trim().max(600, 'tooLong'),
  })
  .refine(
    (v) => v.budgetMin === undefined || v.budgetMax === undefined || v.budgetMin <= v.budgetMax,
    { path: ['budgetMax'], message: 'range' },
  )
  .refine((v) => v.repeat === 'none' || v.repeatCount !== undefined, {
    path: ['repeatCount'],
    message: 'required',
  })

export const GIG_FIELDS = {
  venueId: 'text',
  day: 'text',
  loadIn: 'text',
  setStart: 'text',
  curfew: 'text',
  repeat: 'text',
  repeatCount: 'text',
  genres: 'list',
  format: 'text',
  bandsCount: 'text',
  setLength: 'text',
  budgetMin: 'text',
  budgetMax: 'text',
  includes: 'list',
  visibility: 'text',
  note: 'text',
} as const

export const applicationSchema = z.object({
  bandId: z.string().min(1, 'required'),
  fee: optInt(0, 1_000_000),
  message: z.string().trim().max(500, 'tooLong'),
})
