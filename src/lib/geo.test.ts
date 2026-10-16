import { describe, expect, it } from 'vitest'

import { distanceKm, geoKey, reaches } from './geo'

const lausanne = { lat: 46.5197, lng: 6.6323 }
const fribourg = { lat: 46.8065, lng: 7.1619 }
const geneve = { lat: 46.2044, lng: 6.1432 }

describe('distances', () => {
  it('Lausanne – Fribourg et Lausanne – Genève : une cinquantaine de km à vol d’oiseau', () => {
    for (const d of [distanceKm(lausanne, fribourg), distanceKm(lausanne, geneve)]) {
      expect(d).toBeGreaterThan(50)
      expect(d).toBeLessThan(53)
    }
  })

  it('un groupe atteint un lieu dans son rayon ; inconnu sans rayon ou coordonnées', () => {
    const band = { ...lausanne, radiusKm: 60 }
    expect(reaches(band, fribourg)).toBe(true)
    expect(reaches({ ...band, radiusKm: 30 }, fribourg)).toBe(false)
    expect(reaches({ ...band, radiusKm: null }, fribourg)).toBeNull()
    expect(reaches(band, { lat: null, lng: null })).toBeNull()
  })

  it('clé de cache stable', () => {
    expect(geoKey('  Rue du Port 3 ,  2000  Neuchâtel ')).toBe('rue du port 3, 2000 neuchâtel')
  })
})
