import { describe, expect, it } from 'vitest'

import { authMail, gigMail, mailDate } from './mail-templates'

describe('e-mails de compte', () => {
  it('rédige en anglais pour un compte anglais', () => {
    const m = authMail('verify', 'en', 'Léa', 'http://x/verify?token=abc')
    expect(m.subject).toContain('Confirm your email')
    expect(m.text).toContain('http://x/verify?token=abc')
  })

  it('échappe le nom dans la version HTML', () => {
    const m = authMail('reset', 'fr', '<script>', 'http://x')
    expect(m.html).not.toContain('<script>')
    expect(m.html).toContain('&lt;script&gt;')
  })
})

describe('e-mails des dates', () => {
  it('candidature reçue, en français, avec la date lisible et le lien', () => {
    const m = gigMail(
      'application',
      'fr',
      'Sam',
      { band: 'Les Néons Fauves', orga: 'Le Bocal', date: mailDate('2027-03-12', 'fr') },
      'https://exemple.ch/fr/compte/dates?date=1',
    )
    expect(m.subject).toContain('Les Néons Fauves candidate pour ta date du vendredi 12 mars 2027')
    expect(m.text).toContain('https://exemple.ch/fr/compte/dates?date=1')
  })

  it('refus en anglais, noms échappés dans le HTML', () => {
    const m = gigMail(
      'declined',
      'en',
      'Léa',
      { band: '<Rouille>', orga: 'Le Bocal', date: mailDate('2027-03-12', 'en') },
      'https://example.com/en/open-dates',
    )
    expect(m.subject).toContain('Friday, March 12, 2027')
    expect(m.html).toContain('&lt;Rouille&gt;')
    expect(m.html).not.toContain('<Rouille>')
  })
})
