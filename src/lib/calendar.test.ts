import { describe, expect, it } from 'vitest'

import { addDays, combineBandDays, monthWeeks, parseMonth, shiftMonth, todayIso } from './calendar'

describe('grille du mois', () => {
  it('mars 2027 commence un lundi et tient en 5 semaines', () => {
    const weeks = monthWeeks(2027, 3)
    expect(weeks[0][0]).toBe('2027-03-01')
    expect(weeks).toHaveLength(5)
    expect(weeks.flat().filter(Boolean)).toHaveLength(31)
  })

  it('février 2028 (bissextile) a 29 jours, avec des cases vides avant le 1er', () => {
    const weeks = monthWeeks(2028, 2)
    expect(weeks.flat().filter(Boolean)).toHaveLength(29)
    expect(weeks[0].indexOf('2028-02-01')).toBe(1)
  })

  it('navigation et valeurs invalides', () => {
    expect(shiftMonth(2027, 12, 1)).toEqual({ year: 2028, month: 1 })
    expect(shiftMonth(2027, 1, -1)).toEqual({ year: 2026, month: 12 })
    expect(parseMonth('2027-13', '2026-10-08')).toEqual({ year: 2026, month: 10 })
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
  })

  it('« aujourd’hui » suit le fuseau de Zurich', () => {
    expect(todayIso('Europe/Zurich', new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
})

describe('dispos combinées', () => {
  const days = ['2027-03-13', '2027-03-14', '2027-03-15', '2027-03-21']
  const r = combineBandDays(days, {
    bandBlocked: new Set(['2027-03-13']),
    essentialMembers: [
      { name: 'Léa', busy: new Set(['2027-03-13', '2027-03-14']) },
      { name: 'Sam', busy: new Set(['2027-03-14']) },
    ],
    tours: [{ startDate: '2027-03-20', endDate: '2027-03-22', region: 'Suisse romande' }],
  })

  it('le blocage du groupe passe avant les membres', () => {
    expect(r[0].state).toBe('blocked')
  })

  it('un membre indispensable pris rend le soir indisponible, avec les noms', () => {
    expect(r[1]).toMatchObject({ state: 'members', busyMembers: ['Léa', 'Sam'] })
  })

  it('libre sinon, avec la tournée en cours', () => {
    expect(r[2].state).toBe('free')
    expect(r[3]).toMatchObject({ state: 'free', tour: 'Suisse romande' })
  })
})
