'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useTransition } from 'react'

import { useRouter } from '@/i18n/navigation'

import styles from './calendar.module.css'

export type DayView = {
  state: 'free' | 'blocked' | 'members'
  label: string
  // Jour non modifiable (passé, ou occupé par un membre : rien à basculer côté groupe).
  locked?: boolean
}

// Grille du mois : un clic sur un jour le bascule libre ↔ indispo (affichage immédiat, puis serveur).
export function CalendarGrid({
  weeks,
  days,
  today,
  toggle,
  labels,
}: {
  weeks: (string | null)[][]
  days: Record<string, DayView>
  today: string
  toggle: (day: string) => Promise<{ ok: boolean }>
  labels: { free: string; blocked: string }
}) {
  const t = useTranslations('calendar')
  const format = useFormatter()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [optimistic, flip] = useOptimistic(
    days,
    (current: Record<string, DayView>, day: string): Record<string, DayView> => {
      const d = current[day]
      if (!d || d.state === 'members') return current
      const next: DayView =
        d.state === 'blocked'
          ? { ...d, state: 'free', label: labels.free }
          : { ...d, state: 'blocked', label: labels.blocked }
      return { ...current, [day]: next }
    },
  )
  const weekdays = weeks[0]
    .map((_, i) => new Date(Date.UTC(2024, 0, 1 + i)))
    .map((d) => format.dateTime(d, { weekday: 'short', timeZone: 'UTC' }))

  return (
    <div>
      <div aria-hidden="true" className={styles.grid} style={{ marginBottom: 6 }}>
        {weekdays.map((w) => (
          <span key={w} className={styles.weekday}>
            {w}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {weeks.flat().map((day, i) => {
          if (!day) return <span key={`e${i}`} className={styles.empty} />
          const d = optimistic[day]
          const past = day < today
          const disabled = past || d.locked
          const date = format.dateTime(new Date(`${day}T12:00:00Z`), {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            timeZone: 'UTC',
          })
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-label={t('dayLabel', { date, state: d.label })}
              aria-pressed={d.state === 'blocked'}
              className={`${styles.day} ${styles[d.state]} ${past ? styles.past : ''} ${day === today ? styles.today : ''}`}
              onClick={() =>
                startTransition(async () => {
                  flip(day)
                  await toggle(day)
                  router.refresh()
                })
              }
            >
              <span className={styles.dayNumber}>{Number(day.slice(8))}</span>
              <span className={styles.dayLabel}>{d.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
