'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { band } from '@/db/schema'
import { getBandForEdit } from '@/lib/bands'
import { orNull, readForm } from '@/lib/form-data'
import { BAND_FIELDS, bandEditSchema } from '@/lib/profile-edit'
import { getSession } from '@/lib/session'
import { pickFile, removeMedia, saveImage, savePdf, UploadError } from '@/lib/uploads'
import { fieldErrors } from '@/lib/validation'

import type { FormState } from './types'

export async function updateBand(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return { status: 'error', errors: { form: 'auth' } }
  const current = await getBandForEdit(String(fd.get('bandId') ?? ''), session.user.id)
  if (!current) return { status: 'error', errors: { form: 'forbidden' } }

  const parsed = bandEditSchema.safeParse(readForm(fd, BAND_FIELDS))
  if (!parsed.success) return { status: 'error', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  let photo = current.photo
  let rider = v.removeRider ? null : current.rider
  const photoFile = pickFile(fd.get('photo'))
  const riderFile = pickFile(fd.get('rider'))
  try {
    if (photoFile) photo = await saveImage(photoFile, 1600)
  } catch (e) {
    if (e instanceof UploadError) return { status: 'error', errors: { photo: e.code } }
    throw e
  }
  try {
    if (riderFile) rider = await savePdf(riderFile)
  } catch (e) {
    if (e instanceof UploadError) return { status: 'error', errors: { rider: e.code } }
    throw e
  }

  await db
    .update(band)
    .set({
      name: v.name,
      city: v.city,
      since: v.since ?? null,
      musiciansCount: v.musiciansCount ?? null,
      mainGenre: v.mainGenre,
      genres: v.genres,
      repertoire: orNull(v.repertoire),
      setMin: v.setMin ?? null,
      setMax: v.setMax ?? null,
      listenUrl: v.listenUrl,
      bio: orNull(v.bio),
      story: orNull(v.story),
      discography: orNull(v.discography),
      press: orNull(v.press),
      spotifyUrl: orNull(v.spotifyUrl),
      bandcampUrl: orNull(v.bandcampUrl),
      soundcloudUrl: orNull(v.soundcloudUrl),
      youtubeUrl: orNull(v.youtubeUrl),
      photo,
      rider,
      lineupDetail: orNull(v.lineupDetail),
      backline: orNull(v.backline),
      ownEngineer: v.ownEngineer,
      setupMinutes: v.setupMinutes ?? null,
      minStage: orNull(v.minStage),
      radiusKm: v.radiusKm ?? null,
      regions: orNull(v.regions),
      feeMin: v.feeMin ?? null,
      feeMax: v.feeMax ?? null,
      feeNote: orNull(v.feeNote),
    })
    .where(eq(band.id, current.id))

  // Les anciens fichiers remplacés ou retirés ne servent plus à rien.
  if (photo !== current.photo) await removeMedia(current.photo)
  if (rider !== current.rider) await removeMedia(current.rider)
  return { status: 'saved', errors: {} }
}
