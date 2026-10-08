import { describe, expect, it } from 'vitest'

import { embedFor } from './embeds'
import { slugify } from './slug'

describe('lecteurs intégrés', () => {
  it('YouTube (watch, youtu.be, shorts) passe par youtube-nocookie', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://youtube.com/shorts/dQw4w9WgXcQ',
    ]) {
      expect(embedFor(url)?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
    }
  })

  it('Spotify : album et titre', () => {
    expect(embedFor('https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy?si=x')?.src).toBe(
      'https://open.spotify.com/embed/album/4aawyAB9vmqN3uQ7FjRGTy',
    )
    expect(embedFor('https://open.spotify.com/intl-fr/track/abc123')?.height).toBe(152)
  })

  it('SoundCloud et liens inconnus', () => {
    expect(embedFor('https://soundcloud.com/artiste/titre')?.kind).toBe('soundcloud')
    expect(embedFor('https://bandcamp.com/x')).toBeNull()
    expect(embedFor('javascript:alert(1)')).toBeNull()
    expect(embedFor('pas un lien')).toBeNull()
  })
})

describe('adresses lisibles', () => {
  it('enlève accents et caractères spéciaux', () => {
    expect(slugify('Les Néons Fauves')).toBe('les-neons-fauves')
    expect(slugify('  Œuvre & Cœur !! ')).toBe('oeuvre-coeur')
    expect(slugify('???')).toBe('profil')
  })
})
