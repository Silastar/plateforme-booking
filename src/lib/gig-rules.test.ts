import { describe, expect, it } from 'vitest'

import { gigSchema, matchGig, repeatDays } from './gig-rules'

describe('répétition des dates', () => {
  it('chaque semaine', () => {
    expect(repeatDays('2027-03-12', 'weekly', 3)).toEqual([
      '2027-03-12',
      '2027-03-19',
      '2027-03-26',
    ])
  })

  it('chaque mois, même place : 2e vendredi', () => {
    // 12 mars 2027 = 2e vendredi → 9 avril, 14 mai
    expect(repeatDays('2027-03-12', 'monthly', 3)).toEqual([
      '2027-03-12',
      '2027-04-09',
      '2027-05-14',
    ])
  })

  it('chaque mois : dernier samedi, même les mois à 4 samedis', () => {
    // 27 mars 2027 = dernier samedi → 24 avril, 29 mai
    expect(repeatDays('2027-03-27', 'monthly', 3)).toEqual([
      '2027-03-27',
      '2027-04-24',
      '2027-05-29',
    ])
  })

  it('passe le changement d’année et plafonne à 12', () => {
    expect(repeatDays('2026-12-04', 'monthly', 2)).toEqual(['2026-12-04', '2027-01-01'])
    expect(repeatDays('2027-01-01', 'weekly', 40)).toHaveLength(12)
    expect(repeatDays('2027-01-01', 'none', 5)).toEqual(['2027-01-01'])
  })
})

describe('compatibilité date ↔ groupe', () => {
  const band = { mainGenre: 'rock', genres: ['garage'], feeMin: 800, feeMax: 1200 }

  it('ça colle : genre commun, fourchettes qui se chevauchent, soir dispo', () => {
    const m = matchGig({ genres: ['garage', 'punk'], budgetMin: 700, budgetMax: 900 }, band, true)
    expect(m).toEqual({ genre: true, money: true, night: true, fits: true })
  })

  it('pas de genre commun, budget trop bas ou soir pas dispo : ça ne colle pas', () => {
    expect(matchGig({ genres: ['jazz'], budgetMin: 900, budgetMax: 1000 }, band, true).fits).toBe(
      false,
    )
    expect(matchGig({ genres: ['rock'], budgetMin: 200, budgetMax: 500 }, band, true).money).toBe(
      false,
    )
    expect(matchGig({ genres: ['rock'], budgetMin: 900, budgetMax: 900 }, band, false).fits).toBe(
      false,
    )
  })

  it('cachet ou budget inconnu : on ne bloque pas', () => {
    const m = matchGig(
      { genres: ['rock'], budgetMin: null, budgetMax: null },
      { ...band, feeMin: null, feeMax: null },
      true,
    )
    expect(m).toMatchObject({ money: null, fits: true })
  })
})

describe('formulaire de date', () => {
  const base = {
    venueId: '',
    day: '2027-03-12',
    loadIn: '17:00',
    setStart: '22:00',
    curfew: '',
    repeat: 'none',
    repeatCount: '',
    genres: ['rock'],
    format: 'headline',
    bandsCount: '1',
    setLength: '75',
    budgetMin: '700',
    budgetMax: '1100',
    includes: ['meal'],
    visibility: 'open',
    note: '',
  }

  it('accepte une date complète', () => {
    expect(gigSchema.safeParse(base).success).toBe(true)
  })

  it('refuse budget inversé, heure invalide, aucun genre, répétition sans nombre', () => {
    const r = gigSchema.safeParse({
      ...base,
      budgetMin: '1200',
      loadIn: '25:00',
      genres: [],
      repeat: 'weekly',
    })
    expect(r.success).toBe(false)
    const paths = r.error!.issues.map((i) => i.path[0])
    expect(paths).toEqual(expect.arrayContaining(['budgetMax', 'loadIn', 'genres']))
  })
})
