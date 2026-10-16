import { describe, expect, it } from 'vitest'

import {
  compareWithVenue,
  defaultPlot,
  monitorMixes,
  patchRows,
  riderStats,
  type ObjectDef,
} from './rider-core'

const def = (key: string, o: Partial<ObjectDef>): ObjectDef => ({
  key,
  name: key,
  detail: '',
  icon: '',
  group: 'misc',
  inputs: [],
  mics: [],
  stands: [],
  ...o,
})
const defs: Record<string, ObjectDef> = {
  vocal: def('vocal', {
    group: 'voice',
    inputs: ['Chant'],
    mics: ['SM58'],
    stands: ['tall'],
    venue: 'vocalMic',
  }),
  gtrAmp: def('gtrAmp', {
    group: 'guitar',
    inputs: ['Guitare'],
    mics: ['e906'],
    stands: ['short'],
    venue: 'guitarAmp',
    plot: 'amp',
  }),
  keys: def('keys', {
    group: 'keys',
    inputs: ['Clavier G', 'Clavier D'],
    mics: ['di2'],
    stands: ['none'],
  }),
  drumKit: def('drumKit', {
    group: 'drums',
    inputs: ['GC', 'CC'],
    mics: ['Beta 91', 'SM57'],
    stands: ['none', 'short'],
    venue: 'drumKit',
  }),
  riser: def('riser', { group: 'drums', venue: 'riser', plot: 'riser' }),
  wedge: def('wedge', { group: 'monitors', monitor: 'wedge', venue: 'wedge' }),
  iemHf: def('iemHf', { group: 'monitors', monitor: 'iemHf', venue: 'iem' }),
  power: def('power', { group: 'power', venue: 'power' }),
}
const members = [
  { id: 'sam', name: 'Sam' },
  { id: 'lea', name: 'Léa' },
  { id: 'noe', name: 'Noé' },
]
const item = (
  id: string,
  memberId: string | null,
  objectKey: string,
  provider = 'venue',
  qty = 1,
  mic: string | null = null,
) => ({
  id,
  memberId,
  objectKey,
  provider,
  qty,
  mic,
  note: null,
})
const items = [
  item('i1', 'noe', 'keys', 'band'),
  item('i2', 'sam', 'vocal'),
  item('i3', 'sam', 'gtrAmp', 'band'),
  item('i4', 'sam', 'iemHf', 'band'),
  item('i5', 'lea', 'drumKit'),
  item('i6', 'lea', 'riser'),
  item('i7', 'noe', 'wedge', 'venue', 2),
  item('i8', 'noe', 'power', 'venue', 2),
]

describe('liste des entrées', () => {
  it('suit l’ordre des membres, multiplie par la quantité, applique le micro choisi', () => {
    const rows = patchRows(items, defs, members)
    expect(rows.map((r) => r.source)).toEqual([
      'Chant',
      'Guitare',
      'GC',
      'CC',
      'Clavier G',
      'Clavier D',
    ])
    expect(rows[0]).toMatchObject({ mic: 'SM58', stand: 'tall', memberName: 'Sam' })
    const two = patchRows([item('x', 'sam', 'vocal', 'venue', 2, 'Beta 58')], defs, members)
    expect(two.map((r) => `${r.source}/${r.mic}`)).toEqual(['Chant 1/Beta 58', 'Chant 2/Beta 58'])
  })

  it('respecte l’ordre enregistré, les nouvelles entrées à la fin', () => {
    const rows = patchRows(items, defs, members, ['i1:0:1', 'i5:0:0'])
    expect(rows.slice(0, 3).map((r) => r.source)).toEqual(['Clavier D', 'GC', 'Chant'])
  })
})

describe('retours et compteurs', () => {
  it('un mix par retour, quantité comprise', () => {
    expect(monitorMixes(items, defs, members).map((m) => `${m.memberName}:${m.kind}`)).toEqual([
      'Sam:iemHf',
      'Noé:wedge',
      'Noé:wedge',
    ])
    expect(riderStats(items, defs)).toEqual({ inputs: 6, mixes: 3, power: 2, venue: 5 })
  })
})

describe('comparaison avec le lieu', () => {
  it('fourni, manquant, modèle de micro remplacé', () => {
    const r = compareWithVenue(items, defs, {
      consoleInputs: 24,
      monitorMixes: 2,
      diBoxes: 4,
      vocalMics: 6,
      wedges: 4,
      outlets: 6,
      drumKit: true,
      riser: false,
      instrumentMics: true,
      micList: 'SM57 ×6, Beta 91, e604 ×4',
    })
    const by = Object.fromEntries(r.checks.map((c) => [c.kind + (c.model ?? ''), c.status]))
    expect(by).toMatchObject({
      console: 'ok',
      mixes: 'missing',
      di: 'ok',
      vocalMic: 'ok',
      drumKit: 'ok',
      riser: 'missing',
      wedge: 'ok',
      power: 'ok',
      instrumentMics: 'ok',
      micModele906: 'sub',
    })
    expect(by.micModelSM57).toBeUndefined()
    // Un objet perso branché en « DI » saisi à la main compte comme une DI, pas comme un micro.
    const custom = {
      theremin: def('theremin', { inputs: ['Theremin'], mics: ['DI'], stands: ['none'] }),
    }
    const r2 = compareWithVenue(
      [item('t', 'noe', 'theremin', 'band')],
      { ...defs, ...custom },
      { diBoxes: 1, instrumentMics: true, micList: 'SM57' },
    )
    expect(r2.checks.map((c) => c.kind)).toEqual(['console', 'di'])
    expect(r.known).toBe(true)
  })

  it('lieu sans matériel détaillé : tout est inconnu', () => {
    const r = compareWithVenue(items, defs, {})
    expect(r.known).toBe(false)
    expect(r.ok).toBe(0)
  })
})

describe('plan de scène par défaut', () => {
  it('batteur sur praticable au fond, chanteur devant au centre, rien ne se chevauche', () => {
    const plot = defaultPlot(items, defs, members, {
      riser: 'Batterie',
      amp: 'Ampli',
      wedge: 'Retour',
      power: '230 V',
    })
    const lea = plot.find((p) => p.memberId === 'lea' && p.kind === 'riser')!
    expect(lea).toMatchObject({ x: 4, y: 0, w: 2, h: 2 })
    expect(plot.find((p) => p.id === 'm-sam')).toMatchObject({ x: 4, y: 3 })
    const cells = plot.flatMap((p) =>
      Array.from(
        { length: p.w * p.h },
        (_, k) => `${p.x + (k % p.w)}:${p.y + Math.floor(k / p.w)}`,
      ),
    )
    expect(new Set(cells).size).toBe(cells.length)
    expect(plot.every((p) => p.x >= 0 && p.x + p.w <= 10 && p.y >= 0 && p.y + p.h <= 5)).toBe(true)
  })
})
