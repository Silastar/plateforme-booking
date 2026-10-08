import { describe, expect, it } from 'vitest'

import { authMail } from './mail-templates'

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
