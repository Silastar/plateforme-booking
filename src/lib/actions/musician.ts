'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { musician } from '@/db/schema'
import { orNull, readForm } from '@/lib/form-data'
import { getMusicianForEdit } from '@/lib/musicians'
import { MUSICIAN_FIELDS, musicianEditSchema } from '@/lib/profile-edit'
import { getSession } from '@/lib/session'
import { pickFile, removeMedia, saveImage, UploadError } from '@/lib/uploads'
import { fieldErrors } from '@/lib/validation'

import type { FormState } from './types'

export async function updateMusician(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return { status: 'error', errors: { form: 'auth' } }
  const current = await getMusicianForEdit(session.user.id)
  if (!current) return { status: 'error', errors: { form: 'forbidden' } }
  const parsed = musicianEditSchema.safeParse(readForm(fd, MUSICIAN_FIELDS))
  if (!parsed.success) return { status: 'error', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  let photo = current.photo
  const file = pickFile(fd.get('photo'))
  try {
    if (file) photo = await saveImage(file, 1200)
  } catch (e) {
    if (e instanceof UploadError) return { status: 'error', errors: { photo: e.code } }
    throw e
  }

  await db
    .update(musician)
    .set({
      stageName: v.stageName,
      mainInstrument: v.mainInstrument,
      otherInstruments: orNull(v.otherInstruments),
      city: v.city,
      level: v.level,
      styles: v.styles,
      bio: orNull(v.bio),
      videoUrl: orNull(v.videoUrl),
      videoUrl2: orNull(v.videoUrl2),
      availableForSubs: v.availableForSubs,
      subInstruments: orNull(v.subInstruments),
      subRadiusKm: v.subRadiusKm ?? null,
      subNoticeDays: v.subNoticeDays ?? null,
      repertoireNote: orNull(v.repertoireNote),
      gearNote: orNull(v.gearNote),
      photo,
    })
    .where(eq(musician.userId, current.userId))
  if (photo !== current.photo) await removeMedia(current.photo)
  return { status: 'saved', errors: {} }
}
