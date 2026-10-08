'use client'

import { useTranslations } from 'next-intl'

import styles from './auth.module.css'

const STEPS = ['role', 'account', 'profile', 'done'] as const

export function Steps({ current }: { current: number }) {
  const t = useTranslations('auth.steps')
  return (
    <ol aria-label={t('label')} className={styles.steps}>
      {STEPS.map((s, i) => {
        const n = i + 1
        const cls = n === current ? styles.stepCurrent : n < current ? styles.stepDone : ''
        return (
          <li
            key={s}
            aria-current={n === current ? 'step' : undefined}
            className={`${styles.step} ${cls}`}
          >
            <span className={styles.stepNumber}>{String(n).padStart(2, '0')}</span>
            <span className={styles.stepLabel}>{t(s)}</span>
          </li>
        )
      })}
    </ol>
  )
}
