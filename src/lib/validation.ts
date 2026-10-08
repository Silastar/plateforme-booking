import { z } from 'zod'

import { GENRES } from './genres'

// Schémas partagés : le navigateur les utilise pour guider, le serveur pour décider.
export const ROLES = ['orga', 'groupe', 'musicien'] as const
export type Role = (typeof ROLES)[number]
export const ORG_TYPES = ['salle', 'bar', 'festival', 'association', 'prive'] as const
export const INSTRUMENTS = [
  'batterie',
  'basse',
  'guitare',
  'chant',
  'claviers',
  'cuivres',
  'autre',
] as const
export const LEVELS = ['amateur', 'semipro', 'pro'] as const
export const MIN_PASSWORD = 12

const text = (max: number) => z.string().trim().min(1, 'required').max(max, 'tooLong')
const optionalText = (max: number) => z.string().trim().max(max, 'tooLong').optional()
const httpUrl = z
  .string()
  .trim()
  .max(500, 'tooLong')
  .refine((v) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), 'url')
const optionalUrl = z.union([z.literal(''), httpUrl]).optional()
const optionalInt = (max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number('number').int('number').min(1, 'number').max(max, 'number').optional(),
  )

export const accountSchema = z.object({
  firstName: text(80),
  lastName: text(80),
  email: z.string().trim().toLowerCase().max(200, 'tooLong').pipe(z.email('email')),
  password: z.string().min(MIN_PASSWORD, 'password').max(128, 'tooLong'),
  acceptTerms: z.literal(true, 'terms'),
  newsletter: z.boolean().optional(),
})

export const orgaProfileSchema = z.object({
  role: z.literal('orga'),
  name: text(120),
  type: z.enum(ORG_TYPES, 'required'),
  city: text(120),
  capacity: optionalInt(200000),
  website: optionalUrl,
})

export const bandProfileSchema = z.object({
  role: z.literal('groupe'),
  name: text(120),
  mainGenre: z.enum(GENRES, 'required'),
  city: text(120),
  musiciansCount: optionalInt(40),
  listenUrl: httpUrl,
})

export const musicianProfileSchema = z.object({
  role: z.literal('musicien'),
  stageName: text(120),
  mainInstrument: z.enum(INSTRUMENTS, 'required'),
  otherInstruments: optionalText(200),
  city: text(120),
  level: z.enum(LEVELS, 'required'),
  availableForSubs: z.boolean().optional(),
})

export const profileSchema = z.discriminatedUnion('role', [
  orgaProfileSchema,
  bandProfileSchema,
  musicianProfileSchema,
])
export type ProfileInput = z.infer<typeof profileSchema>

export const registerSchema = z.object({
  locale: z.enum(['fr', 'en']),
  account: accountSchema,
  profile: profileSchema,
})

// Erreurs sous forme { "account.email": "email" } : les codes sont traduits côté interface.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.')
    if (!out[key]) out[key] = /^[a-zA-Z]+$/.test(issue.message) ? issue.message : 'invalid'
  }
  return out
}
