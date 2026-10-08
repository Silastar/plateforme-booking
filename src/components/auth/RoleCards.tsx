'use client'

import { useTranslations } from 'next-intl'

import { ROLES, type Role } from '@/lib/validation'

import styles from './auth.module.css'

export const ACCENT: Record<Role, string> = {
  orga: styles.accentOrga,
  groupe: styles.accentGroupe,
  musicien: styles.accentMusicien,
}

export function RoleCards({ role, onPick }: { role: Role | null; onPick: (r: Role) => void }) {
  const t = useTranslations('auth.signup.role')
  return (
    <div className={styles.roles}>
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={role === r}
          onClick={() => onPick(r)}
          className={`${styles.roleCard} ${ACCENT[r]}`}
        >
          <span className={styles.roleTitle}>
            {t(`${r}.line1`)}
            <br />
            {t(`${r}.line2`)}
          </span>
          <span className={styles.roleText}>{t(`${r}.text`)}</span>
        </button>
      ))}
    </div>
  )
}
