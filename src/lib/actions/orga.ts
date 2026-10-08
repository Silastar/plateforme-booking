'use server'

import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

import { db } from '@/db'
import { organization, venue } from '@/db/schema'
import { orNull, readForm } from '@/lib/form-data'
import { getOrgaForEdit } from '@/lib/orgas'
import { ORGA_FIELDS, orgaEditSchema, VENUE_FIELDS, venueSchema } from '@/lib/profile-edit'
import { getSession } from '@/lib/session'
import { pickFile, removeMedia, saveImage, UploadError } from '@/lib/uploads'
import { fieldErrors } from '@/lib/validation'

import type { FormState } from './types'

async function currentOrga() {
  const session = await getSession()
  if (!session) return null
  return getOrgaForEdit(session.user.id)
}

// Enregistre une photo envoyée ; renvoie l'ancienne valeur si aucun fichier n'a été choisi.
async function image(fd: FormData, field: string, current: string | null, width: number) {
  const file = pickFile(fd.get(field))
  return file ? saveImage(file, width) : current
}

export async function updateOrga(_prev: FormState, fd: FormData): Promise<FormState> {
  const orga = await currentOrga()
  if (!orga) return { status: 'error', errors: { form: 'forbidden' } }
  const parsed = orgaEditSchema.safeParse(readForm(fd, ORGA_FIELDS))
  if (!parsed.success) return { status: 'error', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  let logo: string | null
  let cover: string | null
  try {
    logo = await image(fd, 'logo', orga.logo, 600)
  } catch (e) {
    if (e instanceof UploadError) return { status: 'error', errors: { logo: e.code } }
    throw e
  }
  try {
    cover = await image(fd, 'cover', orga.cover, 1800)
  } catch (e) {
    if (e instanceof UploadError) return { status: 'error', errors: { cover: e.code } }
    throw e
  }

  await db
    .update(organization)
    .set({
      name: v.name,
      type: v.type,
      city: v.city,
      since: v.since ?? null,
      website: orNull(v.website),
      description: orNull(v.description),
      genres: v.genres,
      eventTypes: orNull(v.eventTypes),
      bandsPerNight: orNull(v.bandsPerNight),
      setLength: orNull(v.setLength),
      rhythm: orNull(v.rhythm),
      budgetMin: v.budgetMin ?? null,
      budgetMax: v.budgetMax ?? null,
      feeTerms: orNull(v.feeTerms),
      logo,
      cover,
    })
    .where(eq(organization.id, orga.id))
  if (logo !== orga.logo) await removeMedia(orga.logo)
  if (cover !== orga.cover) await removeMedia(orga.cover)
  return { status: 'saved', errors: {} }
}

// Ajout (venueId vide) ou modification d'un lieu de l'orga connectée.
export async function saveVenue(_prev: FormState, fd: FormData): Promise<FormState> {
  const orga = await currentOrga()
  if (!orga) return { status: 'error', errors: { form: 'forbidden' } }
  const venueId = String(fd.get('venueId') ?? '')
  const existing = venueId ? orga.venues.find((x) => x.id === venueId) : undefined
  if (venueId && !existing) return { status: 'error', errors: { form: 'forbidden' } }

  const parsed = venueSchema.safeParse(readForm(fd, VENUE_FIELDS))
  if (!parsed.success) return { status: 'error', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  let photo: string | null
  try {
    photo = await image(fd, 'photo', existing?.photo ?? null, 1600)
  } catch (e) {
    if (e instanceof UploadError) return { status: 'error', errors: { photo: e.code } }
    throw e
  }

  const values = {
    name: v.name,
    address: orNull(v.address),
    postalCode: orNull(v.postalCode),
    city: v.city,
    capacity: v.capacity ?? null,
    indoor: v.indoor,
    stageSize: orNull(v.stageSize),
    paProvided: v.paProvided,
    lightsProvided: v.lightsProvided,
    engineerOnSite: v.engineerOnSite,
    backline: orNull(v.backline),
    greenRoom: v.greenRoom,
    catering: v.catering,
    loadIn: orNull(v.loadIn),
    curfew: orNull(v.curfew),
    photo,
  }
  if (existing) {
    await db.update(venue).set(values).where(eq(venue.id, existing.id))
    if (photo !== existing.photo) await removeMedia(existing.photo)
  } else {
    await db.insert(venue).values({ id: randomUUID(), organizationId: orga.id, ...values })
  }
  return { status: 'saved', errors: {} }
}

export async function deleteVenue(_prev: FormState, fd: FormData): Promise<FormState> {
  const orga = await currentOrga()
  if (!orga) return { status: 'error', errors: { form: 'forbidden' } }
  const target = orga.venues.find((x) => x.id === String(fd.get('venueId') ?? ''))
  if (!target) return { status: 'error', errors: { form: 'forbidden' } }
  await db.delete(venue).where(and(eq(venue.id, target.id), eq(venue.organizationId, orga.id)))
  await removeMedia(target.photo)
  return { status: 'saved', errors: {} }
}
