import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/rider/rider.module.css'
import { RiderMatch } from '@/components/rider/RiderMatch'
import { RiderSheet } from '@/components/rider/RiderSheet'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getBandPage } from '@/lib/bands'
import { getOrgaForEdit } from '@/lib/orgas'
import { compareWithVenue, defaultPlot, monitorMixes, riderStats } from '@/lib/rider-core'
import { itemData, loadBandRiders, memberData } from '@/lib/riders'
import { getSession } from '@/lib/session'

type Props = {
  params: Promise<{ locale: Locale; slug: string }>
  searchParams: Promise<{ config?: string; lieu?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const band = await getBandPage(slug)
  const t = await getTranslations({ locale, namespace: 'rider' })
  return band ? { title: `${t('title')} · ${band.name}`, robots: { index: false } } : {}
}

export default async function PublicRiderPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const band = await getBandPage(slug)
  if (!band) notFound()
  const t = await getTranslations('rider')
  const tn = await getTranslations('nav')
  const session = await getSession()
  const back = (
    <Link href={{ pathname: '/groupes/[slug]', params: { slug } }} className="label">
      ← {band.name}
    </Link>
  )

  // Comme le PDF de la fiche technique : réservée aux comptes connectés.
  if (!session)
    return (
      <section className={styles.page}>
        <div className={`container ${styles.wrap}`}>
          {back}
          <h1 className={`display ${styles.title}`}>{t('title')}</h1>
          <p className={styles.panel}>{t('public.locked')}</p>
          <div>
            <Link href="/connexion" className="btn btn--red">
              {tn('login')}
            </Link>
          </div>
        </div>
      </section>
    )

  const isAdmin = band.members.some((m) => m.userId === session.user.id && m.isAdmin)
  const { riders, members, defs } = await loadBandRiders(band.id)
  const sp = await searchParams
  const current = riders.find((r) => r.id === sp.config) ?? riders[0]
  const orga = session.user.role === 'orga' ? await getOrgaForEdit(session.user.id) : null
  const venue = orga?.venues.find((v) => v.id === sp.lieu) ?? orga?.venues[0]

  if (!current)
    return (
      <section className={styles.page}>
        <div className={`container ${styles.wrap}`}>
          {back}
          <h1 className={`display ${styles.title}`}>{t('title')}</h1>
          <p className={styles.panel}>{t('public.none')}</p>
        </div>
      </section>
    )

  const mData = members.map(memberData)
  const items = current.items.map(itemData)
  const stats = riderStats(items, defs)
  const mixes = monitorMixes(items, defs, mData)
  const plot = current.plot.length
    ? current.plot
    : defaultPlot(items, defs, mData, {
        riser: t('plot.riser'),
        amp: t('plot.amp'),
        wedge: t('plot.wedge'),
        power: t('plot.power'),
      })
  const bring = items
    .filter((i) => i.provider === 'band' && defs[i.objectKey])
    .map((i) => {
      const who = mData.find((m) => m.id === i.memberId)?.name.split(' ')[0]
      return `${defs[i.objectKey].name}${i.qty > 1 ? ` ×${i.qty}` : ''}${who ? ` (${who})` : ''}`
    })
  const match = venue ? compareWithVenue(items, defs, venue.gear) : null
  const pdfHref = `/api/fiche/${current.id}/pdf?lang=${locale}${venue ? `&lieu=${venue.id}` : ''}`

  return (
    <section className={styles.page}>
      <div className={`container ${styles.wrap}`}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
          }}
        >
          <div>
            {back}
            <h1 className={`display ${styles.title}`} style={{ marginTop: 10 }}>
              {t('title')}
            </h1>
          </div>
          <div className={styles.toolbar}>
            {isAdmin && (
              <Link
                href={{
                  pathname: '/compte/groupe/[id]/fiche-technique',
                  params: { id: band.id },
                  query: { config: current.id },
                }}
                className="btn btn--ghost"
              >
                {t('public.edit')}
              </Link>
            )}
            <a href={pdfHref} className="btn btn--red">
              {t('pdf')}
            </a>
          </div>
        </div>

        {riders.length > 1 && (
          <nav className={styles.tabs} aria-label={t('configs.label')}>
            {riders.map((r) => (
              <Link
                key={r.id}
                href={{
                  pathname: '/groupes/[slug]/fiche-technique',
                  params: { slug },
                  query: venue ? { config: r.id, lieu: venue.id } : { config: r.id },
                }}
                className={styles.tab}
                aria-current={r.id === current.id ? 'page' : undefined}
              >
                {r.name}
              </Link>
            ))}
          </nav>
        )}

        <div className={styles.layout}>
          <RiderSheet
            bandName={band.name}
            rider={current}
            items={items}
            defs={defs}
            members={mData}
            mixes={mixes}
            plot={plot}
            stats={stats}
          />
          <aside className={styles.aside}>
            {orga && (
              <section
                className={`${styles.panel} ${styles.panelAmber}`}
                aria-label={t('match.pickVenue')}
              >
                {venue && match ? (
                  <>
                    <span className="label" style={{ color: 'var(--c-amber)' }}>
                      {t('match.with', { venue: venue.name })}
                    </span>
                    <RiderMatch {...match} />
                    <p className={styles.faint} style={{ margin: 0 }}>
                      {match.known ? t('match.note') : t('match.unknown')}
                    </p>
                    {!match.known && (
                      <Link href="/compte/orga" className="btn btn--amber">
                        {t('match.fillVenue')}
                      </Link>
                    )}
                    {orga.venues.length > 1 && (
                      <div className={styles.toolbar}>
                        <span className={styles.faint}>{t('match.pickVenue')} :</span>
                        {orga.venues.map((v) => (
                          <Link
                            key={v.id}
                            href={{
                              pathname: '/groupes/[slug]/fiche-technique',
                              params: { slug },
                              query: { config: current.id, lieu: v.id },
                            }}
                            className={styles.tab}
                            aria-current={v.id === venue.id ? 'page' : undefined}
                          >
                            {v.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className={styles.muted}>{t('match.unknown')}</p>
                    <Link href="/compte/orga" className="btn btn--amber">
                      {t('match.fillVenue')}
                    </Link>
                  </>
                )}
              </section>
            )}
            <section className={styles.panel} aria-labelledby="bring">
              <h2 id="bring" className={styles.h3} style={{ color: 'var(--c-amber)' }}>
                {t('public.bring')}
              </h2>
              {bring.length ? (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    color: 'var(--c-text-soft)',
                  }}
                >
                  {bring.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{t('public.nothing')}</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}
