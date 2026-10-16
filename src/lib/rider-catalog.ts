// Catalogue des objets de fiche technique. Les noms, détails et noms d'entrées sont dans
// messages/*.json (rider.objects.<clé>) ; ici, la structure : entrées, micros et pieds par défaut,
// retour éventuel, et ce que la salle doit avoir quand l'objet est « à fournir ».

export const RIDER_GROUPS = [
  'voice',
  'drums',
  'guitar',
  'bass',
  'keys',
  'other',
  'monitors',
  'power',
  'misc',
] as const
export type RiderGroup = (typeof RIDER_GROUPS)[number]

export type Stand = 'none' | 'short' | 'tall' | 'clip'
export type Monitor = 'wedge' | 'iemWired' | 'iemHf' | 'sidefill'
export const MONITORS: Monitor[] = ['wedge', 'iemWired', 'iemHf', 'sidefill']
export const STANDS: Stand[] = ['none', 'short', 'tall', 'clip']
export type VenueNeed =
  | 'vocalMic'
  | 'drumKit'
  | 'bassAmp'
  | 'guitarAmp'
  | 'keyboard'
  | 'keyboardStand'
  | 'riser'
  | 'wedge'
  | 'iem'
  | 'sidefill'
  | 'power'

// Micros : un modèle (« SM58 ») ou un jeton traduit à l'affichage (di, di2, diActive, own).
export const MIC_TOKENS = ['di', 'di2', 'diActive', 'own'] as const

export type CatalogObject = {
  group: RiderGroup
  icon: string
  inputs: number
  mics?: string[]
  stands?: Stand[]
  monitor?: Monitor
  venue?: VenueNeed
  // Sur le plan de scène par défaut
  plot?: 'amp' | 'riser' | 'keys'
}

export const CATALOG = {
  vocal: {
    group: 'voice',
    icon: '🎤',
    inputs: 1,
    mics: ['SM58'],
    stands: ['tall'],
    venue: 'vocalMic',
  },
  backing: {
    group: 'voice',
    icon: '🎤',
    inputs: 1,
    mics: ['SM58'],
    stands: ['tall'],
    venue: 'vocalMic',
  },
  vocalHf: { group: 'voice', icon: '📡', inputs: 1, mics: ['own'], stands: ['none'] },
  voxFx: { group: 'voice', icon: '🎛️', inputs: 1, mics: ['di'], stands: ['none'] },
  drumKit: {
    group: 'drums',
    icon: '🥁',
    inputs: 9,
    mics: ['Beta 91', 'SM57', 'SM57', 'SM81', 'e604', 'e604', 'e604', 'KM184', 'KM184'],
    stands: ['none', 'short', 'short', 'short', 'clip', 'clip', 'clip', 'tall', 'tall'],
    venue: 'drumKit',
  },
  kick: { group: 'drums', icon: '🥁', inputs: 1, mics: ['Beta 91'], stands: ['none'] },
  snare: { group: 'drums', icon: '🥁', inputs: 1, mics: ['SM57'], stands: ['short'] },
  hihat: { group: 'drums', icon: '🥁', inputs: 1, mics: ['SM81'], stands: ['short'] },
  toms: { group: 'drums', icon: '🥁', inputs: 3, mics: ['e604'], stands: ['clip'] },
  overheads: { group: 'drums', icon: '🥁', inputs: 2, mics: ['KM184'], stands: ['tall'] },
  edrums: { group: 'drums', icon: '🎛️', inputs: 2, mics: ['di2'], stands: ['none'] },
  cajon: {
    group: 'drums',
    icon: '🪘',
    inputs: 2,
    mics: ['e904', 'Beta 91'],
    stands: ['short', 'none'],
  },
  percussion: { group: 'drums', icon: '🪇', inputs: 2, mics: ['SM81'], stands: ['tall'] },
  riser: { group: 'drums', icon: '▭', inputs: 0, venue: 'riser', plot: 'riser' },
  gtrAmp: {
    group: 'guitar',
    icon: '🔊',
    inputs: 1,
    mics: ['e906'],
    stands: ['short'],
    venue: 'guitarAmp',
    plot: 'amp',
  },
  modeler: { group: 'guitar', icon: '🎛️', inputs: 2, mics: ['di2'], stands: ['none'] },
  acoustic: { group: 'guitar', icon: '🎸', inputs: 1, mics: ['di'], stands: ['none'] },
  bassAmp: {
    group: 'bass',
    icon: '🔊',
    inputs: 2,
    mics: ['diActive', 'Beta 52'],
    stands: ['none', 'short'],
    venue: 'bassAmp',
    plot: 'amp',
  },
  bassDi: { group: 'bass', icon: '🎸', inputs: 1, mics: ['diActive'], stands: ['none'] },
  doubleBass: { group: 'bass', icon: '🎻', inputs: 1, mics: ['di'], stands: ['none'] },
  keys: {
    group: 'keys',
    icon: '🎹',
    inputs: 2,
    mics: ['di2'],
    stands: ['none'],
    venue: 'keyboard',
    plot: 'keys',
  },
  piano: {
    group: 'keys',
    icon: '🎹',
    inputs: 2,
    mics: ['di2'],
    stands: ['none'],
    venue: 'keyboard',
    plot: 'keys',
  },
  synth: { group: 'keys', icon: '🎛️', inputs: 1, mics: ['di'], stands: ['none'] },
  laptop: { group: 'keys', icon: '💻', inputs: 2, mics: ['di2'], stands: ['none'] },
  horn: { group: 'other', icon: '🎺', inputs: 1, mics: ['MD421'], stands: ['tall'] },
  sax: { group: 'other', icon: '🎷', inputs: 1, mics: ['MD421'], stands: ['tall'] },
  violin: { group: 'other', icon: '🎻', inputs: 1, mics: ['di'], stands: ['none'] },
  wedge: { group: 'monitors', icon: '◣', inputs: 0, monitor: 'wedge', venue: 'wedge' },
  iemWired: { group: 'monitors', icon: '🎧', inputs: 0, monitor: 'iemWired' },
  iemHf: { group: 'monitors', icon: '📡', inputs: 0, monitor: 'iemHf', venue: 'iem' },
  sidefill: { group: 'monitors', icon: '🔊', inputs: 0, monitor: 'sidefill', venue: 'sidefill' },
  power: { group: 'power', icon: '⚡', inputs: 0, venue: 'power' },
  multi: { group: 'power', icon: '🔌', inputs: 0 },
  stand: { group: 'misc', icon: '🎙️', inputs: 0 },
  kbStand: { group: 'misc', icon: '🎹', inputs: 0, venue: 'keyboardStand' },
} as const satisfies Record<string, CatalogObject>

export type CatalogKey = keyof typeof CATALOG
export const CATALOG_KEYS = Object.keys(CATALOG) as CatalogKey[]
export const isCatalogKey = (k: string): k is CatalogKey => k in CATALOG

// Objets proposés d'office selon l'instrument principal d'un musicien (pré-remplissage).
export const INSTRUMENT_TEMPLATES: Record<string, CatalogKey[]> = {
  batterie: ['drumKit', 'wedge'],
  basse: ['bassAmp', 'wedge'],
  guitare: ['gtrAmp', 'wedge'],
  chant: ['vocal', 'wedge'],
  claviers: ['keys', 'wedge', 'power'],
  cuivres: ['horn', 'wedge'],
  autre: ['wedge'],
}
