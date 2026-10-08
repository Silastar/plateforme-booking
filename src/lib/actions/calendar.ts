'use server'

import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { db } from '@/db'
import { bandAvailability, tour, unavailability } from '@/db/schema'
import { getBandForEdit } from '@/lib/bands'
import { addDays, todayIso } from '@/lib/calendar'
import { getMusicianForEdit } from '@/lib/musicians'
import { getSession } from '@/lib/session'
import { fieldErrors } from '@/lib/validation'

import type { FormState } from './types'

const DAY = /^\d{4}-\d{2}-\d{2}$/

// Jours modifiables : d'aujourd'hui à deux ans.
function editableDay(day: string) {
  const today = todayIso()
  return DAY.test(day) && day >= today && day <= addDays(today, 730)
}

export async function toggleBandDay(bandId: string, day: string): Promise<{ ok: boolean }> {
  const session = await getSession()
  if (!session || !editableDay(day)) return { ok: false }
  const b = await getBandForEdit(bandId, session.user.id)
  if (!b) return { ok: false }
  const existing = await db.query.bandAvailability.findFirst({
    where: and(eq(bandAvailability.bandId, b.id), eq(bandAvailability.day, day)),
  })
  if (existing) await db.delete(bandAvailability).where(eq(bandAvailability.id, existing.id))
  else
    await db
      .insert(bandAvailability)
      .values({ id: randomUUID(), bandId: b.id, day })
      .onConflictDoNothing()
  return { ok: true }
}

export async function toggleMusicianDay(day: string): Promise<{ ok: boolean }> {
  const session = await getSession()
  if (!session || !editableDay(day)) return { ok: false }
  const m = await getMusicianForEdit(session.user.id)
  if (!m) return { ok: false }
  const existing = await db.query.unavailability.findFirst({
    where: and(eq(unavailability.userId, m.userId), eq(unavailability.day, day)),
  })
  if (existing) await db.delete(unavailability).where(eq(unavailability.id, existing.id))
  else
    await db
      .insert(unavailability)
      .values({ id: randomUUID(), userId: m.userId, day })
      .onConflictDoNothing()
  return { ok: true }
}

const tourSchema = z
  .object({
    startDate: z.string().regex(DAY, 'required'),
    endDate: z.string().regex(DAY, 'required'),
    region: z.string().trim().min(1, 'required').max(120, 'tooLong'),
  })
  .refine((v) => v.startDate <= v.endDate, { path: ['endDate'], message: 'range' })
  .refine((v) => v.endDate >= todayIso(), { path: ['endDate'], message: 'past' })

export async function addTour(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return { status: 'error', errors: { form: 'auth' } }
  const b = await getBandForEdit(String(fd.get('bandId') ?? ''), session.user.id)
  if (!b) return { status: 'error', errors: { form: 'forbidden' } }
  const parsed = tourSchema.safeParse({
    startDate: String(fd.get('startDate') ?? ''),
    endDate: String(fd.get('endDate') ?? ''),
    region: String(fd.get('region') ?? ''),
  })
  if (!parsed.success) return { status: 'error', errors: fieldErrors(parsed.error) }
  await db.insert(tour).values({ id: randomUUID(), bandId: b.id, ...parsed.data })
  return { status: 'saved', errors: {} }
}

export async function deleteTour(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return { status: 'error', errors: { form: 'auth' } }
  const b = await getBandForEdit(String(fd.get('bandId') ?? ''), session.user.id)
  if (!b) return { status: 'error', errors: { form: 'forbidden' } }
  await db
    .delete(tour)
    .where(and(eq(tour.id, String(fd.get('tourId') ?? '')), eq(tour.bandId, b.id)))
  return { status: 'saved', errors: {} }
}
