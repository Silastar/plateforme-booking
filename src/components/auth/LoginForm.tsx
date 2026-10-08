'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { getPathname, Link, useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'

import styles from './auth.module.css'
import { TextField, useErrorText } from './fields'
import { SocialButtons } from './SocialButtons'

export function LoginForm({ providers }: { providers: string[] }) {
  const t = useTranslations('auth.login')
  const ts = useTranslations('auth.signup.account')
  const errorText = useErrorText()
  const locale = useLocale()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [resent, setResent] = useState(false)
  const [sending, setSending] = useState(false)
  const accountPath = getPathname({ locale, href: '/compte' })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    setResent(false)
    const { error: err } = await authClient.signIn.email({ email, password })
    setSending(false)
    if (err) {
      setError(
        err.code === 'EMAIL_NOT_VERIFIED'
          ? 'notVerified'
          : err.code === 'INVALID_EMAIL_OR_PASSWORD'
            ? 'credentials'
            : 'server',
      )
      return
    }
    router.push('/compte')
    router.refresh()
  }

  async function resend() {
    await authClient.sendVerificationEmail({ email, callbackURL: `${accountPath}?verifie=1` })
    setResent(true)
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={`display ${styles.title}`}>{t('heading')}</h1>
      {providers.length > 0 && (
        <>
          <SocialButtons providers={providers} callbackURL={accountPath} />
          <div className={`label ${styles.separator}`}>{ts('orEmail')}</div>
        </>
      )}
      {error && (
        <div role="alert" className={styles.alert}>
          {errorText(error)}
          {error === 'notVerified' && !resent && (
            <div>
              <button type="button" className={styles.linkButton} onClick={resend}>
                {t('resend')}
              </button>
            </div>
          )}
          {resent && <div style={{ marginTop: 8 }}>{t('resent')}</div>}
        </div>
      )}
      <TextField
        label={t('email')}
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
      <TextField
        label={t('password')}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
      />
      <div className={styles.actions}>
        <Link href="/mot-de-passe-oublie">{t('forgot')}</Link>
        <button
          type="submit"
          className={`btn ${styles.submit}`}
          disabled={sending || !email || !password}
        >
          {t('submit')}
        </button>
      </div>
      <p className={styles.muted}>
        {t('noAccount')} <Link href="/inscription">{t('signup')}</Link>
      </p>
    </form>
  )
}
