'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useRouter } from '@/i18n/navigation'
import { fieldErrors, profileSchema, ROLES, type Role } from '@/lib/validation'

import styles from './auth.module.css'
import { useErrorText } from './fields'
import { EMPTY_PROFILE, ProfileFields, profilePayload, type ProfileValues } from './ProfileFields'
import { ACCENT, RoleCards } from './RoleCards'

// Après une connexion Google / Microsoft / … : le compte existe, il manque le profil.
export function OnboardingForm({ initialRole }: { initialRole: string | null }) {
  const t = useTranslations('auth.signup')
  const errorText = useErrorText()
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(
    ROLES.includes(initialRole as Role) ? (initialRole as Role) : null,
  )
  const [profile, setProfile] = useState<ProfileValues>(EMPTY_PROFILE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return setErrors({ form: 'role' })
    const payload = profilePayload(role, profile)
    const r = profileSchema.safeParse(payload)
    if (!r.success) {
      const errs = fieldErrors(r.error)
      return setErrors(
        Object.fromEntries(Object.entries(errs).map(([k, v]) => [`profile.${k}`, v])),
      )
    }
    setSending(true)
    const res = await fetch('/api/profil', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSending(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return setErrors(data.errors ?? { form: 'server' })
    }
    router.push('/compte')
    router.refresh()
  }

  return (
    <form className={`${styles.form} ${role ? ACCENT[role] : ''}`} onSubmit={submit} noValidate>
      {errors.form && (
        <p role="alert" className={styles.alert}>
          {errorText(errors.form)}
        </p>
      )}
      <RoleCards role={role} onPick={setRole} />
      {role && (
        <>
          <h2 className={`display ${styles.title}`}>{t(`profile.title.${role}`)}</h2>
          <ProfileFields
            role={role}
            values={profile}
            onChange={(k, v) => setProfile((p) => ({ ...p, [k]: v }))}
            errors={errors}
          />
          <button
            type="submit"
            className={`btn ${styles.submit}`}
            disabled={sending}
            style={{ alignSelf: 'flex-start' }}
          >
            {sending ? t('sending') : t('create')}
          </button>
        </>
      )}
    </form>
  )
}
