'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { getPathname, Link } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'

import styles from './auth.module.css'
import { TextField } from './fields'

export function ForgotForm() {
  const t = useTranslations('auth.forgot')
  const locale = useLocale()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await authClient.requestPasswordReset({
      email,
      redirectTo: getPathname({ locale, href: '/nouveau-mot-de-passe' }),
    })
    // Même message que le compte existe ou non : on ne révèle pas quelles adresses sont inscrites.
    setSent(true)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={`display ${styles.title}`}>{t('heading')}</h1>
      {sent ? (
        <p role="status" className={styles.success}>
          {t('sent')}
        </p>
      ) : (
        <>
          <p className={styles.intro}>{t('text')}</p>
          <TextField
            label={t('email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          <button
            type="submit"
            className={`btn ${styles.submit}`}
            disabled={!email}
            style={{ alignSelf: 'flex-start' }}
          >
            {t('submit')}
          </button>
        </>
      )}
      <Link href="/connexion">{t('back')}</Link>
    </form>
  )
}
