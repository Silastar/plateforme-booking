'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useOptimistic, useTransition } from 'react'

import { useRouter } from '@/i18n/navigation'

import styles from './calendar.module.css'

// Groupe : unset (vierge) ↔ open (dispo), members (membre pris). Agenda du musicien : free ↔ busy.
export type DayState = 'open' | 'unset' | 'members' | 'free' | 'busy'

export type DayView = {
  state: DayState
  // Lu par les lecteurs d'écran ; « visible » remplace le texte affiché dans la case (vide = rien).
  label: string
  visible?: string
  // Jour non modifiable (passé, ou occupé par un membre : rien à basculer côté groupe).
  locked?: boolean
}

// Grille du mois : un clic bascule le jour entre ses deux états (affichage immédiat, puis serveur).
// « off » = état de départ d'un jour vierge, « on » = état coché.
export function CalendarGrid({
  weeks,
  days,
  today,
  toggle,
  off,
  on,
}: {
  weeks: (string | null)[][]
  days: Record<string, DayView>
  today: string
  toggle: (day: string) => Promise<{ ok: boolean }>
  off: Omit<DayView, 'locked'>
  on: Omit<DayView, 'locked'>
}) {
  const t = useTranslations('calendar')
  const format = useFormatter()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [optimistic, flip] = useOptimistic(
    days,
    (current: Record<string, DayView>, day: string): Record<string, DayView> => {
      const d = current[day]
      if (!d || (d.state !== on.state && d.state !== off.state)) return current
      return {
        ...current,
        [day]: { ...d, visible: undefined, ...(d.state === on.state ? off : on) },
      }
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
              aria-pressed={d.state === on.state}
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
              <span className={styles.dayLabel}>{d.visible ?? d.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
