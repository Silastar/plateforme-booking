import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/calendar/calendar.module.css'
import { CalendarGrid, type DayView } from '@/components/calendar/CalendarGrid'
import { MonthNav } from '@/components/calendar/MonthNav'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { toggleMusicianDay } from '@/lib/actions/calendar'
import { musicianBusyDays } from '@/lib/availability'
import { monthWeeks, parseMonth, todayIso } from '@/lib/calendar'
import { getMusicianForEdit } from '@/lib/musicians'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ mois?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'calendar' })
  return { title: t('musicianTitle') }
}

export default async function MusicianAgendaPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const m = await getMusicianForEdit(session.user.id)
  if (!m) notFound()

  const t = await getTranslations('calendar')
  const today = todayIso()
  const { year, month } = parseMonth((await searchParams).mois, today)
  const weeks = monthWeeks(year, month)
  const all = weeks.flat().filter((d): d is string => Boolean(d))
  const busy = new Set(
    (await musicianBusyDays(m.userId, all[0], all[all.length - 1])).map((b) => b.day),
  )
  const days: Record<string, DayView> = Object.fromEntries(
    all.map((d) => [
      d,
      busy.has(d) ? { state: 'blocked', label: t('busy') } : { state: 'free', label: t('free') },
    ]),
  )

  return (
    <section style={{ padding: '44px var(--gutter) 72px' }}>
      <div
        className="container"
        style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div>
          <Link href="/compte/musicien" className="label">
            ← {m.stageName}
          </Link>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 96px)', marginTop: 10 }}>
            {t('musicianTitle')}
          </h1>
          <p style={{ margin: '10px 0 0', color: 'var(--c-text-soft)', maxWidth: 680 }}>
            {t('musicianIntro')}
          </p>
        </div>
        <div className={styles.wrap}>
          <MonthNav
            year={year}
            month={month}
            makeHref={(mois) => ({ pathname: '/compte/musicien/agenda', query: { mois } })}
          />
          <CalendarGrid
            weeks={weeks}
            days={days}
            today={today}
            toggle={toggleMusicianDay}
            labels={{ free: t('free'), blocked: t('busy') }}
          />
        </div>
      </div>
    </section>
  )
}
