'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { getPathname, Link } from '@/i18n/navigation'
import { accountSchema, fieldErrors, profileSchema, type Role } from '@/lib/validation'

import styles from './auth.module.css'
import { CheckField, TextField, useErrorText } from './fields'
import { EMPTY_PROFILE, ProfileFields, profilePayload, type ProfileValues } from './ProfileFields'
import { ACCENT, RoleCards } from './RoleCards'
import { SocialButtons } from './SocialButtons'
import { Steps } from './Steps'

type Account = {
  firstName: string
  lastName: string
  email: string
  password: string
  acceptTerms: boolean
  newsletter: boolean
}

const EMPTY_ACCOUNT: Account = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  acceptTerms: false,
  newsletter: false,
}

const prefixed = (prefix: string, errors: Record<string, string>) =>
  Object.fromEntries(Object.entries(errors).map(([k, v]) => [`${prefix}.${k}`, v]))

export function SignupFlow({ providers }: { providers: string[] }) {
  const t = useTranslations('auth.signup')
  const locale = useLocale()
  const errorText = useErrorText()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<Role | null>(null)
  const [account, setAccount] = useState<Account>(EMPTY_ACCOUNT)
  const [profile, setProfile] = useState<ProfileValues>(EMPTY_PROFILE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const setAccountField = <K extends keyof Account>(k: K, v: Account[K]) =>
    setAccount((a) => ({ ...a, [k]: v }))

  function goToProfile() {
    const r = accountSchema.safeParse(account)
    if (!r.success) {
      setErrors(prefixed('account', fieldErrors(r.error)))
      return
    }
    setErrors({})
    setStep(3)
  }

  async function submit() {
    if (!role) return
    const payload = profilePayload(role, profile)
    const r = profileSchema.safeParse(payload)
    if (!r.success) {
      setErrors(prefixed('profile', fieldErrors(r.error)))
      return
    }
    setErrors({})
    setSending(true)
    try {
      const res = await fetch('/api/inscription', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale, account, profile: payload }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setSentTo(data.email ?? account.email)
        setStep(4)
      } else {
        const errs: Record<string, string> = data.errors ?? { form: 'server' }
        setErrors(errs)
        // Une erreur sur le compte (e-mail déjà pris…) renvoie à l'étape 2.
        if (Object.keys(errs).some((k) => k.startsWith('account.'))) setStep(2)
      }
    } catch {
      setErrors({ form: 'server' })
    } finally {
      setSending(false)
    }
  }

  const accent = role ? ACCENT[role] : ''
  const socialCallback = role
    ? `${getPathname({ locale, href: '/inscription/profil' })}?role=${role}`
    : ''

  return (
    <div className={`${styles.form} ${accent}`} style={{ gap: 32 }}>
      <Steps current={step} />

      {errors.form && (
        <p role="alert" className={styles.alert}>
          {errorText(errors.form)}
        </p>
      )}

      {step === 1 && (
        <section aria-labelledby="t1" className={styles.form} style={{ gap: 22 }}>
          <h1 id="t1" className={`display ${styles.title}`}>
            {t('role.title')}
          </h1>
          <RoleCards role={role} onPick={setRole} />
          <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
            <button
              type="button"
              className={`btn ${styles.submit}`}
              disabled={!role}
              onClick={() => setStep(2)}
            >
              {t('next')}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <form
          aria-labelledby="t2"
          className={styles.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            goToProfile()
          }}
        >
          <h1 id="t2" className={`display ${styles.title}`}>
            {t('account.title')}
          </h1>
          {providers.length > 0 && (
            <>
              <SocialButtons providers={providers} callbackURL={socialCallback} />
              <div className={`label ${styles.separator}`}>{t('account.orEmail')}</div>
            </>
          )}
          <div className={styles.grid2}>
            <TextField
              label={t('account.firstName')}
              autoComplete="given-name"
              value={account.firstName}
              onChange={(v) => setAccountField('firstName', v)}
              error={errors['account.firstName']}
            />
            <TextField
              label={t('account.lastName')}
              autoComplete="family-name"
              value={account.lastName}
              onChange={(v) => setAccountField('lastName', v)}
              error={errors['account.lastName']}
            />
          </div>
          <TextField
            label={t('account.email')}
            type="email"
            autoComplete="email"
            value={account.email}
            onChange={(v) => setAccountField('email', v)}
            error={errors['account.email']}
          />
          <TextField
            label={t('account.password')}
            type="password"
            autoComplete="new-password"
            help={t('account.passwordHelp')}
            value={account.password}
            onChange={(v) => setAccountField('password', v)}
            error={errors['account.password']}
          />
          <div className={styles.checks}>
            <CheckField
              checked={account.acceptTerms}
              onChange={(v) => setAccountField('acceptTerms', v)}
              error={errors['account.acceptTerms']}
            >
              {t.rich('account.terms', {
                terms: (c) => <Link href="/conditions">{c}</Link>,
                privacy: (c) => <Link href="/confidentialite">{c}</Link>,
              })}
            </CheckField>
            <CheckField
              checked={account.newsletter}
              onChange={(v) => setAccountField('newsletter', v)}
            >
              {t('account.newsletter')}
            </CheckField>
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn btn--ghost" onClick={() => setStep(1)}>
              {t('back')}
            </button>
            <button type="submit" className={`btn ${styles.submit}`}>
              {t('next')}
            </button>
          </div>
        </form>
      )}

      {step === 3 && role && (
        <form
          aria-labelledby="t3"
          className={styles.form}
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <h1 id="t3" className={`display ${styles.title}`}>
            {t(`profile.title.${role}`)}
          </h1>
          <p className={styles.intro}>
            {t('profile.intro', { later: t(`profile.later.${role}`) })}
          </p>
          <ProfileFields
            role={role}
            values={profile}
            onChange={(k, v) => setProfile((p) => ({ ...p, [k]: v }))}
            errors={errors}
          />
          <div className={styles.actions}>
            <button type="button" className="btn btn--ghost" onClick={() => setStep(2)}>
              {t('back')}
            </button>
            <button type="submit" className={`btn ${styles.submit}`} disabled={sending}>
              {sending ? t('sending') : t('create')}
            </button>
          </div>
        </form>
      )}

      {step === 4 && role && (
        <section aria-labelledby="t4" className={styles.paper}>
          <span aria-hidden="true" className={styles.tapePiece} />
          <span className={styles.stamp}>{t(`done.stamp.${role}`)}</span>
          <h1 id="t4" className={`display ${styles.paperTitle}`}>
            {t(`done.title.${role}`)}
          </h1>
          <p style={{ margin: 0, fontWeight: 700 }}>{t('done.checkEmail', { email: sentTo })}</p>
          <ol className={styles.markerList}>
            {(t.raw(`done.next.${role}`) as string[]).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <Link href="/connexion" className="btn btn--ink" style={{ alignSelf: 'flex-start' }}>
            {t('done.login')}
          </Link>
        </section>
      )}
    </div>
  )
}
