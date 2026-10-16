// Calculs de la fiche technique, sans base ni traduction : liste des entrées, retours,
// compteurs, comparaison avec le matériel d'un lieu, plan de scène par défaut.
import type { PlotItem, VenueGear } from '@/db/schema'

import type { Monitor, Stand, VenueNeed } from './rider-catalog'

// Objet résolu (catalogue ou objet perso), noms déjà traduits.
export type ObjectDef = {
  key: string
  name: string
  detail: string
  icon: string
  group: string
  inputs: string[]
  mics: string[]
  stands: Stand[]
  monitor?: Monitor
  venue?: VenueNeed
  plot?: 'amp' | 'riser' | 'keys'
  custom?: boolean
}

export type RiderItemData = {
  id: string
  memberId: string | null
  objectKey: string
  provider: string
  qty: number
  mic: string | null
  note: string | null
}

export type MemberData = { id: string; name: string }

export type PatchRow = {
  key: string
  itemId: string
  source: string
  mic: string
  stand: Stand
  memberId: string | null
  memberName: string
}

const memberName = (members: MemberData[], id: string | null) =>
  members.find((m) => m.id === id)?.name ?? ''

// Une ligne par entrée (multipliée par la quantité), dans l'ordre choisi puis l'ordre des membres.
export function patchRows(
  items: RiderItemData[],
  defs: Record<string, ObjectDef>,
  members: MemberData[],
  order: string[] = [],
): PatchRow[] {
  const memberIndex = (id: string | null) => {
    const i = members.findIndex((m) => m.id === id)
    return i < 0 ? members.length : i
  }
  const rows: (PatchRow & { base: number })[] = []
  const sorted = [...items].sort((a, b) => memberIndex(a.memberId) - memberIndex(b.memberId))
  for (const item of sorted) {
    const def = defs[item.objectKey]
    if (!def) continue
    for (let q = 0; q < item.qty; q++) {
      def.inputs.forEach((label, i) => {
        rows.push({
          key: `${item.id}:${q}:${i}`,
          itemId: item.id,
          source: item.qty > 1 ? `${label} ${q + 1}` : label,
          mic: item.mic || def.mics[i] || def.mics[0] || '',
          stand: def.stands[i] ?? def.stands[0] ?? 'none',
          memberId: item.memberId,
          memberName: memberName(members, item.memberId),
          base: rows.length,
        })
      })
    }
  }
  const rank = (r: { key: string; base: number }) => {
    const i = order.indexOf(r.key)
    return i < 0 ? order.length + r.base : i
  }
  return rows.sort((a, b) => rank(a) - rank(b))
}

export type MonitorMix = {
  memberId: string | null
  memberName: string
  kind: Monitor
  itemId: string
}

export function monitorMixes(
  items: RiderItemData[],
  defs: Record<string, ObjectDef>,
  members: MemberData[],
): MonitorMix[] {
  const out: MonitorMix[] = []
  const memberIndex = (id: string | null) => {
    const i = members.findIndex((m) => m.id === id)
    return i < 0 ? members.length : i
  }
  for (const item of [...items].sort((a, b) => memberIndex(a.memberId) - memberIndex(b.memberId))) {
    const def = defs[item.objectKey]
    if (!def?.monitor) continue
    for (let q = 0; q < item.qty; q++)
      out.push({
        memberId: item.memberId,
        memberName: memberName(members, item.memberId),
        kind: def.monitor,
        itemId: item.id,
      })
  }
  return out
}

export function riderStats(items: RiderItemData[], defs: Record<string, ObjectDef>) {
  let inputs = 0
  let mixes = 0
  let power = 0
  let venue = 0
  for (const item of items) {
    const def = defs[item.objectKey]
    if (!def) continue
    inputs += def.inputs.length * item.qty
    if (def.monitor) mixes += item.qty
    if (def.venue === 'power') power += item.qty
    if (item.provider === 'venue') venue += 1
  }
  return { inputs, mixes, power, venue }
}

/* ---------- Comparaison avec le matériel d'un lieu ---------- */

export type CheckKind =
  'console' | 'mixes' | 'di' | 'instrumentMics' | 'micModel' | Exclude<VenueNeed, 'riser'> | 'riser'
export type CheckStatus = 'ok' | 'sub' | 'missing' | 'unknown'
export type Check = {
  kind: CheckKind
  status: CheckStatus
  need: number
  have?: number
  model?: string
}

const COUNTED: Partial<Record<VenueNeed, keyof VenueGear>> = {
  vocalMic: 'vocalMics',
  wedge: 'wedges',
  iem: 'iemSystems',
  power: 'outlets',
}
const FLAGS: Partial<Record<VenueNeed, keyof VenueGear>> = {
  drumKit: 'drumKit',
  bassAmp: 'bassAmp',
  guitarAmp: 'guitarAmp',
  keyboard: 'keyboard',
  keyboardStand: 'keyboardStand',
  riser: 'riser',
  sidefill: 'sidefill',
}
// DI saisie à la main (« DI », « DI stéréo ») ou jeton du catalogue (di, di2, diActive).
const isDi = (mic: string) =>
  /^di\b|^di[A-Z0-9]/.test(mic) || mic.toLowerCase().startsWith('di ') || mic.toLowerCase() === 'di'
const count = (n: number, have: number | undefined): CheckStatus =>
  have === undefined ? 'unknown' : have >= n ? 'ok' : 'missing'

export function compareWithVenue(
  items: RiderItemData[],
  defs: Record<string, ObjectDef>,
  gear: VenueGear,
): { checks: Check[]; ok: number; total: number; known: boolean } {
  const checks: Check[] = []
  const rows = patchRows(items, defs, [])
  const mixes = monitorMixes(items, defs, []).length
  if (rows.length)
    checks.push({
      kind: 'console',
      need: rows.length,
      have: gear.consoleInputs,
      status: count(rows.length, gear.consoleInputs),
    })
  if (mixes)
    checks.push({
      kind: 'mixes',
      need: mixes,
      have: gear.monitorMixes,
      status: count(mixes, gear.monitorMixes),
    })
  const di = rows.filter((r) => isDi(r.mic)).length
  if (di) checks.push({ kind: 'di', need: di, have: gear.diBoxes, status: count(di, gear.diBoxes) })

  // Ce que la salle doit fournir, regroupé par besoin.
  const needs = new Map<VenueNeed, number>()
  for (const item of items) {
    const def = defs[item.objectKey]
    if (!def?.venue || item.provider !== 'venue') continue
    const n = def.venue === 'vocalMic' ? def.inputs.length * item.qty : item.qty
    needs.set(def.venue, (needs.get(def.venue) ?? 0) + n)
  }
  for (const [need, n] of needs) {
    const countKey = COUNTED[need]
    if (countKey) {
      const have = gear[countKey] as number | undefined
      checks.push({ kind: need, need: n, have, status: count(n, have) })
      continue
    }
    const flag = gear[FLAGS[need]!] as boolean | undefined
    checks.push({
      kind: need,
      need: n,
      status: flag === undefined ? 'unknown' : flag ? 'ok' : 'missing',
    })
  }

  // Micros d'instrument (hors chant, DI et systèmes perso) : le lieu en a-t-il, et les modèles demandés ?
  const instrumentRows = rows.filter((r) => {
    const def = defs[items.find((i) => i.id === r.itemId)!.objectKey]
    return def.venue !== 'vocalMic' && !isDi(r.mic) && r.mic !== 'own' && r.mic !== ''
  })
  if (instrumentRows.length) {
    checks.push({
      kind: 'instrumentMics',
      need: instrumentRows.length,
      status:
        gear.instrumentMics === undefined ? 'unknown' : gear.instrumentMics ? 'ok' : 'missing',
    })
    const list = (gear.micList ?? '').toLowerCase()
    if (gear.instrumentMics && list.trim()) {
      const models = [...new Set(instrumentRows.map((r) => r.mic))]
      for (const model of models)
        if (!list.includes(model.toLowerCase()))
          checks.push({
            kind: 'micModel',
            need: instrumentRows.filter((r) => r.mic === model).length,
            model,
            status: 'sub',
          })
    }
  }
  const known = checks.some((c) => c.status !== 'unknown')
  return { checks, ok: checks.filter((c) => c.status === 'ok').length, total: checks.length, known }
}

/* ---------- Plan de scène par défaut ---------- */

export const PLOT_COLS = 10
export const PLOT_ROWS = 5

// Batterie au fond au centre (sur praticable), chant devant au centre, les autres de part et d'autre ;
// amplis derrière leur musicien, retours au bord de scène, une prise à côté de qui en demande.
export function defaultPlot(
  items: RiderItemData[],
  defs: Record<string, ObjectDef>,
  members: MemberData[],
  labels: { riser: string; amp: string; wedge: string; power: string },
): PlotItem[] {
  const out: PlotItem[] = []
  const has = (m: MemberData, test: (d: ObjectDef) => boolean) =>
    items.some((i) => i.memberId === m.id && defs[i.objectKey] && test(defs[i.objectKey]))
  const isDrummer = (m: MemberData) => has(m, (d) => d.group === 'drums' && d.inputs.length > 0)
  const drummer = members.find(isDrummer)
  const singer = members.find((m) => m !== drummer && has(m, (d) => d.venue === 'vocalMic'))
  const others = members.filter((m) => m !== drummer && m !== singer)
  const slots = [
    { x: 1, y: 2 },
    { x: 7, y: 2 },
    { x: 1, y: 3 },
    { x: 7, y: 3 },
    { x: 4, y: 2 },
  ]
  const place = (m: MemberData, x: number, y: number) => {
    out.push({ id: `m-${m.id}`, kind: 'member', label: m.name, memberId: m.id, x, y, w: 2, h: 1 })
    if (has(m, (d) => d.plot === 'amp'))
      out.push({
        id: `a-${m.id}`,
        kind: 'object',
        label: labels.amp,
        memberId: m.id,
        x: Math.min(x, PLOT_COLS - 1),
        y: 0,
        w: 1,
        h: 1,
      })
    if (y >= 2 && has(m, (d) => d.monitor === 'wedge'))
      out.push({
        id: `w-${m.id}`,
        kind: 'wedge',
        label: labels.wedge,
        memberId: m.id,
        x,
        y: 4,
        w: 1,
        h: 1,
      })
    if (has(m, (d) => d.venue === 'power'))
      out.push({
        id: `p-${m.id}`,
        kind: 'power',
        label: labels.power,
        memberId: m.id,
        x: Math.min(x + 2, PLOT_COLS - 1),
        y,
        w: 1,
        h: 1,
      })
  }
  if (drummer) {
    // Le batteur est posé sur son praticable : un seul élément de 2 × 2 cases.
    out.push({
      id: `m-${drummer.id}`,
      kind: 'riser',
      label: `${drummer.name} · ${labels.riser}`,
      memberId: drummer.id,
      x: 4,
      y: 0,
      w: 2,
      h: 2,
    })
    if (has(drummer, (d) => d.monitor === 'wedge'))
      out.push({
        id: `w-${drummer.id}`,
        kind: 'wedge',
        label: labels.wedge,
        memberId: drummer.id,
        x: 6,
        y: 1,
        w: 1,
        h: 1,
      })
  }
  if (singer) place(singer, 4, 3)
  others.forEach((m, i) => {
    const s = slots[i % slots.length]
    place(m, s.x, s.y)
  })
  // Pas deux éléments sur la même case : on décale vers la droite si besoin.
  const taken = new Set<string>()
  for (const p of out) {
    let guard = 0
    const cells = () =>
      Array.from({ length: p.w * p.h }, (_, k) => `${p.x + (k % p.w)}:${p.y + Math.floor(k / p.w)}`)
    while (cells().some((c) => taken.has(c)) && guard++ < PLOT_COLS * PLOT_ROWS) {
      p.x += 1
      if (p.x + p.w > PLOT_COLS) {
        p.x = 0
        p.y = (p.y + 1) % PLOT_ROWS
      }
    }
    cells().forEach((c) => taken.add(c))
  }
  return out
}
