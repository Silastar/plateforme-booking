import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/gigs/gigs.module.css'
import { GigTicket, toTicket } from '@/components/gigs/GigTicket'
import type { Locale } from '@/i18n/routing'
import { getAdminBands } from '@/lib/bands'
import { getBandApplications, getOpenGigs, matchForBands } from '@/lib/gigs'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gigs.list' })
  return { title: t('title'), description: t('introVisitor') }
}

export default async function OpenDatesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('gigs')
  const session = await getSession()
  const bands = session ? await getAdminBands(session.user.id) : []
  const gigs = await getOpenGigs()
  const matches = await matchForBands(gigs, bands)
  const applied = new Set(
    (await getBandApplications(bands.map((b) => b.id)))
      .filter((a) => a.status === 'pending')
      .map((a) => a.gigId),
  )
  // Les dates qui collent passent en premier, puis l'ordre chronologique.
  const sorted = [...gigs].sort(
    (a, b) => Number(matches.get(b.id)?.fits ?? 0) - Number(matches.get(a.id)?.fits ?? 0),
  )
  const fitsCount = gigs.filter((g) => matches.get(g.id)?.fits).length

  return (
    <section className={styles.page}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h1 className={`display ${styles.pageTitle}`}>{t('list.title')}</h1>
          <p className={styles.intro}>{session ? t('list.intro') : t('list.introVisitor')}</p>
          {fitsCount > 0 && (
            <p className={styles.intro} style={{ color: 'var(--c-amber)', fontWeight: 800 }}>
              {t('list.fitsCount', { count: fitsCount })}
            </p>
          )}
        </div>
        {sorted.length === 0 ? (
          <p className={styles.empty}>{t('list.empty')}</p>
        ) : (
          <ul className={styles.tickets}>
            {sorted.map((g) => (
              <li key={g.id}>
                <GigTicket
                  gig={toTicket(g)}
                  unlocked={Boolean(session)}
                  badge={
                    applied.has(g.id)
                      ? { label: t('ticket.applied'), muted: true }
                      : matches.get(g.id)?.fits
                        ? { label: t('ticket.fits') }
                        : undefined
                  }
                  link={!session ? 'login' : bands.length ? 'apply' : 'view'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
