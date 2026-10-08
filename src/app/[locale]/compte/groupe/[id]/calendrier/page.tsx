import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/calendar/calendar.module.css'
import { CalendarGrid, type DayView } from '@/components/calendar/CalendarGrid'
import { MonthNav } from '@/components/calendar/MonthNav'
import { TourManager } from '@/components/calendar/TourManager'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { toggleBandDay } from '@/lib/actions/calendar'
import { bandAvailability, bandTours } from '@/lib/availability'
import { getBandForEdit } from '@/lib/bands'
import { monthWeeks, parseMonth, todayIso } from '@/lib/calendar'
import { getSession } from '@/lib/session'

type Props = {
  params: Promise<{ locale: Locale; id: string }>
  searchParams: Promise<{ mois?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'calendar' })
  return { title: t('bandTitle') }
}

export default async function BandCalendarPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const band = await getBandForEdit(id, session.user.id)
  if (!band) notFound()

  const t = await getTranslations('calendar')
  const today = todayIso()
  const { year, month } = parseMonth((await searchParams).mois, today)
  const weeks = monthWeeks(year, month)
  const [availability, tours] = await Promise.all([
    bandAvailability(
      band.id,
      weeks.flat().filter((d): d is string => Boolean(d)),
    ),
    bandTours(band.id),
  ])
  const days: Record<string, DayView> = {}
  for (const a of availability) {
    days[a.day] = {
      state: a.state,
      locked: a.state === 'members',
      label:
        a.state === 'blocked'
          ? t('blocked')
          : a.state === 'members'
            ? t('busyMembers', { names: a.busyMembers.join(', ') })
            : a.tour
              ? t('freeOnTour')
              : t('free'),
    }
  }

  return (
    <section style={{ padding: '44px var(--gutter) 72px' }}>
      <div
        className="container"
        style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div>
          <Link
            href={{ pathname: '/compte/groupe/[id]', params: { id: band.id } }}
            className="label"
          >
            ← {band.name}
          </Link>
          <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 96px)', marginTop: 10 }}>
            {t('bandTitle')}
          </h1>
          <p style={{ margin: '10px 0 0', color: 'var(--c-text-soft)', maxWidth: 680 }}>
            {t('bandIntro')}
          </p>
        </div>
        <div className={styles.wrap}>
          <MonthNav
            year={year}
            month={month}
            makeHref={(mois) => ({
              pathname: '/compte/groupe/[id]/calendrier',
              params: { id: band.id },
              query: { mois },
            })}
          />
          <CalendarGrid
            weeks={weeks}
            days={days}
            today={today}
            toggle={toggleBandDay.bind(null, band.id)}
            labels={{ free: t('free'), blocked: t('blocked') }}
          />
          <div className={styles.legend}>
            <span>
              <i className={styles.swatch} style={{ border: '2px solid var(--c-amber)' }} />
              {t('free')}
            </span>
            <span>
              <i
                className={styles.swatch}
                style={{ background: 'var(--c-ink)', border: '1px solid var(--c-line)' }}
              />
              {t('blocked')}
            </span>
            <span>
              <i
                className={styles.swatch}
                style={{ background: '#2a0f0d', border: '2px dashed var(--c-red-bright)' }}
              />
              {t('legendMembers')}
            </span>
          </div>
        </div>
        <TourManager bandId={band.id} tours={tours} />
      </div>
    </section>
  )
}
