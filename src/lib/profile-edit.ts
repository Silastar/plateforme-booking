import { z } from 'zod'

import { GENRES } from './genres'
import { INSTRUMENTS, LEVELS, ORG_TYPES } from './validation'

// Validation des formulaires « Modifier mon profil ». Les codes d'erreur sont traduits à l'affichage.
const text = (max: number) => z.string().trim().min(1, 'required').max(max, 'tooLong')
const optText = (max: number) => z.string().trim().max(max, 'tooLong')
const url = z
  .string()
  .trim()
  .max(500, 'tooLong')
  .refine((v) => v === '' || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), 'url')
const optInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number('number').int('number').min(min, 'number').max(max, 'number').optional(),
  )
const year = optInt(1900, new Date().getFullYear())
const genres = z.array(z.enum(GENRES)).max(6, 'tooMany')

export const bandEditSchema = z
  .object({
    name: text(120),
    city: text(120),
    since: year,
    musiciansCount: optInt(1, 40),
    mainGenre: z.enum(GENRES, 'required'),
    genres,
    repertoire: z.enum(['', 'compos', 'reprises', 'mixte']),
    setMin: optInt(5, 600),
    setMax: optInt(5, 600),
    listenUrl: url.refine((v) => v !== '', 'required'),
    bio: optText(400),
    story: optText(4000),
    discography: optText(1000),
    press: optText(1000),
    spotifyUrl: url,
    bandcampUrl: url,
    soundcloudUrl: url,
    youtubeUrl: url,
    lineupDetail: optText(300),
    backline: optText(500),
    ownEngineer: z.boolean(),
    setupMinutes: optInt(0, 600),
    minStage: optText(60),
    radiusKm: optInt(1, 5000),
    regions: optText(300),
    feeMin: optInt(0, 1_000_000),
    feeMax: optInt(0, 1_000_000),
    feeNote: optText(300),
    removeRider: z.boolean(),
  })
  .refine((v) => v.setMin === undefined || v.setMax === undefined || v.setMin <= v.setMax, {
    path: ['setMax'],
    message: 'range',
  })
  .refine((v) => v.feeMin === undefined || v.feeMax === undefined || v.feeMin <= v.feeMax, {
    path: ['feeMax'],
    message: 'range',
  })

export const BAND_FIELDS = {
  name: 'text',
  city: 'text',
  since: 'text',
  musiciansCount: 'text',
  mainGenre: 'text',
  genres: 'list',
  repertoire: 'text',
  setMin: 'text',
  setMax: 'text',
  listenUrl: 'text',
  bio: 'text',
  story: 'text',
  discography: 'text',
  press: 'text',
  spotifyUrl: 'text',
  bandcampUrl: 'text',
  soundcloudUrl: 'text',
  youtubeUrl: 'text',
  lineupDetail: 'text',
  backline: 'text',
  ownEngineer: 'bool',
  setupMinutes: 'text',
  minStage: 'text',
  radiusKm: 'text',
  regions: 'text',
  feeMin: 'text',
  feeMax: 'text',
  feeNote: 'text',
  removeRider: 'bool',
} as const

export const orgaEditSchema = z
  .object({
    name: text(120),
    type: z.enum(ORG_TYPES, 'required'),
    city: text(120),
    since: year,
    website: url,
    description: optText(1500),
    genres,
    eventTypes: optText(200),
    bandsPerNight: optText(100),
    setLength: optText(100),
    rhythm: optText(100),
    budgetMin: optInt(0, 1_000_000),
    budgetMax: optInt(0, 1_000_000),
    feeTerms: optText(300),
  })
  .refine(
    (v) => v.budgetMin === undefined || v.budgetMax === undefined || v.budgetMin <= v.budgetMax,
    {
      path: ['budgetMax'],
      message: 'range',
    },
  )

export const ORGA_FIELDS = {
  name: 'text',
  type: 'text',
  city: 'text',
  since: 'text',
  website: 'text',
  description: 'text',
  genres: 'list',
  eventTypes: 'text',
  bandsPerNight: 'text',
  setLength: 'text',
  rhythm: 'text',
  budgetMin: 'text',
  budgetMax: 'text',
  feeTerms: 'text',
} as const

export const venueSchema = z.object({
  name: text(120),
  address: optText(200),
  postalCode: optText(20),
  city: text(120),
  capacity: optInt(1, 200_000),
  indoor: z.boolean(),
  stageSize: optText(60),
  paProvided: z.boolean(),
  lightsProvided: z.boolean(),
  engineerOnSite: z.boolean(),
  backline: optText(300),
  greenRoom: z.boolean(),
  catering: z.boolean(),
  loadIn: optText(40),
  curfew: optText(40),
})

export const VENUE_FIELDS = {
  name: 'text',
  address: 'text',
  postalCode: 'text',
  city: 'text',
  capacity: 'text',
  indoor: 'bool',
  stageSize: 'text',
  paProvided: 'bool',
  lightsProvided: 'bool',
  engineerOnSite: 'bool',
  backline: 'text',
  greenRoom: 'bool',
  catering: 'bool',
  loadIn: 'text',
  curfew: 'text',
} as const

export const musicianEditSchema = z.object({
  stageName: text(120),
  mainInstrument: z.enum(INSTRUMENTS, 'required'),
  otherInstruments: optText(200),
  city: text(120),
  level: z.enum(LEVELS, 'required'),
  styles: genres,
  bio: optText(2000),
  videoUrl: url,
  videoUrl2: url,
  availableForSubs: z.boolean(),
  subInstruments: optText(200),
  subRadiusKm: optInt(1, 5000),
  subNoticeDays: optInt(0, 365),
  repertoireNote: optText(300),
  gearNote: optText(300),
})

export const MUSICIAN_FIELDS = {
  stageName: 'text',
  mainInstrument: 'text',
  otherInstruments: 'text',
  city: 'text',
  level: 'text',
  styles: 'list',
  bio: 'text',
  videoUrl: 'text',
  videoUrl2: 'text',
  availableForSubs: 'bool',
  subInstruments: 'text',
  subRadiusKm: 'text',
  subNoticeDays: 'text',
  repertoireNote: 'text',
  gearNote: 'text',
} as const
