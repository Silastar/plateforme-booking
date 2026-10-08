'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'
import { MIN_PASSWORD } from '@/lib/validation'

import styles from './auth.module.css'
import { TextField, useErrorText } from './fields'

export function ResetForm({ token, invalid }: { token: string; invalid: boolean }) {
  const t = useTranslations('auth.reset')
  const errorText = useErrorText()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(invalid || !token ? 'tokenInvalid' : '')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < MIN_PASSWORD) return setError('password')
    if (password !== confirm) return setError('mismatch')
    const { error: err } = await authClient.resetPassword({ newPassword: password, token })
    if (err) return setError(err.code === 'INVALID_TOKEN' ? 'tokenInvalid' : 'server')
    setDone(true)
  }

  if (done) {
    return (
      <div className={styles.form}>
        <h1 className={`display ${styles.title}`}>{t('heading')}</h1>
        <p role="status" className={styles.success}>
          {t('done')}
        </p>
        <Link
          href="/connexion"
          className={`btn ${styles.submit}`}
          style={{ alignSelf: 'flex-start' }}
        >
          {t('login')}
        </Link>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h1 className={`display ${styles.title}`}>{t('heading')}</h1>
      {error && (
        <p role="alert" className={styles.alert}>
          {errorText(error)}
          {error === 'tokenInvalid' && (
            <>
              {' '}
              <Link href="/mot-de-passe-oublie">{t('again')}</Link>
            </>
          )}
        </p>
      )}
      {error !== 'tokenInvalid' && (
        <>
          <TextField
            label={t('password')}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
          />
          <TextField
            label={t('confirm')}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
          />
          <button
            type="submit"
            className={`btn ${styles.submit}`}
            style={{ alignSelf: 'flex-start' }}
          >
            {t('submit')}
          </button>
        </>
      )}
    </form>
  )
}
