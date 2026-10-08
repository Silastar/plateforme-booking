import { describe, expect, it } from 'vitest'

import { readForm } from './form-data'
import { BAND_FIELDS, bandEditSchema } from './profile-edit'
import { fieldErrors } from './validation'

function bandForm(extra: Record<string, string | string[]> = {}) {
  const fd = new FormData()
  const base: Record<string, string | string[]> = {
    name: 'Rouille',
    city: 'Neuchâtel',
    mainGenre: 'stoner',
    genres: ['rock', 'metal'],
    repertoire: 'compos',
    listenUrl: 'https://bandcamp.com/rouille',
    ...extra,
  }
  for (const [k, v] of Object.entries(base)) {
    for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item)
  }
  return readForm(fd, BAND_FIELDS)
}

describe('édition du profil groupe', () => {
  it('accepte un formulaire minimal et lit les cases à cocher', () => {
    const r = bandEditSchema.safeParse(bandForm({ ownEngineer: 'on' }))
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.genres).toEqual(['rock', 'metal'])
      expect(r.data.ownEngineer).toBe(true)
      expect(r.data.removeRider).toBe(false)
    }
  })

  it('refuse un cachet min supérieur au max', () => {
    const r = bandEditSchema.safeParse(bandForm({ feeMin: '1500', feeMax: '800' }))
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).feeMax).toBe('range')
  })

  it('refuse un lien Spotify invalide et plus de 6 genres', () => {
    const r = bandEditSchema.safeParse(
      bandForm({
        spotifyUrl: 'spotify',
        genres: ['rock', 'punk', 'jazz', 'electro', 'folk', 'metal', 'blues'],
      }),
    )
    expect(r.success).toBe(false)
    if (!r.success) {
      const e = fieldErrors(r.error)
      expect(e.spotifyUrl).toBe('url')
      expect(e.genres).toBe('tooMany')
    }
  })
})
