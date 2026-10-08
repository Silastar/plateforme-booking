import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads')
export const MEDIA_NAME = /^[0-9a-f-]{36}\.(webp|pdf)$/
const MAX_BYTES = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']

export class UploadError extends Error {
  constructor(public code: 'fileType' | 'fileSize') {
    super(code)
  }
}

// Fichier choisi dans un formulaire (champ vide = pas de changement).
export function pickFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null
}

// Photo : redimensionnée, convertie en WebP, sans métadonnées (position GPS, appareil…).
export async function saveImage(file: File, maxWidth = 1600): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new UploadError('fileType')
  if (file.size > MAX_BYTES) throw new UploadError('fileSize')
  const name = `${randomUUID()}.webp`
  await mkdir(UPLOAD_DIR, { recursive: true })
  try {
    await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(UPLOAD_DIR, name))
  } catch {
    throw new UploadError('fileType')
  }
  return `/media/${name}`
}

// Fiche technique : PDF uniquement (vérifié sur le contenu, pas seulement le nom).
export async function savePdf(file: File): Promise<string> {
  if (file.size > MAX_BYTES) throw new UploadError('fileSize')
  const bytes = Buffer.from(await file.arrayBuffer())
  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') throw new UploadError('fileType')
  const name = `${randomUUID()}.pdf`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(path.join(UPLOAD_DIR, name), bytes)
  return `/media/${name}`
}

export async function removeMedia(publicPath: string | null | undefined) {
  const name = publicPath?.replace(/^\/media\//, '')
  if (!name || !MEDIA_NAME.test(name)) return
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined)
}
