import { describe, expect, it } from 'vitest'

import { accountSchema, fieldErrors, profileSchema, registerSchema } from './validation'

const account = {
  firstName: 'Léa',
  lastName: 'Rochat',
  email: ' Lea@Example.com ',
  password: 'un-mot-de-passe-long',
  acceptTerms: true as const,
}

describe('validation inscription', () => {
  it('accepte un compte valide et normalise l’e-mail', () => {
    const r = accountSchema.parse(account)
    expect(r.email).toBe('lea@example.com')
  })

  it('refuse un mot de passe trop court et les conditions non acceptées', () => {
    const r = accountSchema.safeParse({ ...account, password: 'court', acceptTerms: false })
    expect(r.success).toBe(false)
    if (!r.success) {
      const e = fieldErrors(r.error)
      expect(e.password).toBe('password')
      expect(e.acceptTerms).toBe('terms')
    }
  })

  it('exige un lien d’écoute pour un groupe', () => {
    const r = profileSchema.safeParse({
      role: 'groupe',
      name: 'Rouille',
      mainGenre: 'stoner',
      city: 'Neuchâtel',
      listenUrl: 'pas un lien',
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(fieldErrors(r.error).listenUrl).toBe('url')
  })

  it('accepte une orga sans site ni capacité', () => {
    const r = profileSchema.safeParse({
      role: 'orga',
      name: 'Le Bocal',
      type: 'salle',
      city: 'Fribourg',
      capacity: '',
      website: '',
    })
    expect(r.success).toBe(true)
  })

  it('refuse un rôle inconnu (pas de compte admin par l’inscription)', () => {
    const r = registerSchema.safeParse({
      locale: 'fr',
      account,
      profile: { role: 'admin', name: 'x' },
    })
    expect(r.success).toBe(false)
  })
})
