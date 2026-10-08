// Dates du calendrier sous forme « AAAA-MM-JJ » : pas de fuseau horaire en jeu, un jour reste un jour.

export const TIME_ZONE = 'Europe/Zurich'

export function todayIso(timeZone = TIME_ZONE, now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

const pad = (n: number) => String(n).padStart(2, '0')

export function iso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Mois demandé (« 2027-03 »), ou le mois courant si absent / invalide.
export function parseMonth(
  value: string | undefined,
  today = todayIso(),
): { year: number; month: number } {
  const m = value?.match(/^(\d{4})-(\d{2})$/)
  if (m) {
    const year = Number(m[1])
    const month = Number(m[2])
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) return { year, month }
  }
  return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) }
}

export function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

export const monthKey = (year: number, month: number) => `${year}-${pad(month)}`

// Semaines du mois, du lundi au dimanche ; null = case vide avant le 1er ou après le dernier jour.
export function monthWeeks(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const offset = (first.getUTCDay() + 6) % 7
  const cells: (string | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(year, month, d))
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function weekdayIndex(day: string): number {
  return (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7
}

export type Tour = { startDate: string; endDate: string; region: string }
export type BandDay = {
  day: string
  // open : le groupe s'est dit dispo ; unset : rien de coché (pas dispo) ; members : un membre indispensable est pris
  state: 'open' | 'unset' | 'members'
  busyMembers: string[]
  tour: string | null
}

// Dispos combinées : le calendrier part vierge. Un soir est dispo seulement si le groupe l'a coché
// et si tous ses membres indispensables sont libres (agenda perso, plus tard shows confirmés).
export function combineBandDays(
  days: string[],
  input: {
    bandOpen: Set<string>
    essentialMembers: { name: string; busy: Set<string> }[]
    tours: Tour[]
  },
): BandDay[] {
  return days.map((day) => {
    const busyMembers = input.essentialMembers.filter((m) => m.busy.has(day)).map((m) => m.name)
    const tour = input.tours.find((t) => t.startDate <= day && day <= t.endDate)?.region ?? null
    const state = busyMembers.length ? 'members' : input.bandOpen.has(day) ? 'open' : 'unset'
    return { day, state, busyMembers, tour }
  })
}
