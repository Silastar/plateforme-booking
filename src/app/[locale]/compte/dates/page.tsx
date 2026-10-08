import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ActionButton } from '@/components/gigs/ActionButton'
import { ChfText, DayFormat } from '@/components/gigs/DayFormat'
import styles from '@/components/gigs/gigs.module.css'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { cancelGig, declineApplication } from '@/lib/actions/gigs'
import { todayIso } from '@/lib/calendar'
import { matchGig } from '@/lib/gig-rules'
import { bandsOpenOn, compatibleBands, getOrgaGigs } from '@/lib/gigs'
import { getOrgaForEdit } from '@/lib/orgas'
import { getSession } from '@/lib/session'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ onglet?: string; date?: string; publie?: string }>
}

const TABS = ['open', 'past', 'cancelled'] as const
type Tab = (typeof TABS)[number]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gigs.mine' })
  return { title: t('title') }
}

export default async function MyDatesPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const orga = await getOrgaForEdit(session.user.id)
  if (!orga) notFound()
  const sp = await searchParams
  const t = await getTranslations('gigs')
  const tg = await getTranslations('genres')

  const today = todayIso()
  const all = await getOrgaGigs(orga.id)
  const tabOf = (g: (typeof all)[number]): Tab =>
    g.status === 'cancelled'
      ? 'cancelled'
      : g.day < today || g.status === 'filled'
        ? 'past'
        : 'open'
  const selected = all.find((g) => g.id === sp.date)
  const tab: Tab = selected
    ? tabOf(selected)
    : (TABS as readonly string[]).includes(sp.onglet ?? '')
      ? (sp.onglet as Tab)
      : 'open'
  const shown = all.filter((g) => tabOf(g) === tab)
  if (tab !== 'open') shown.reverse()
  const counts = Object.fromEntries(TABS.map((x) => [x, all.filter((g) => tabOf(g) === x).length]))
  const pendingCount = all
    .filter((g) => tabOf(g) === 'open')
    .reduce((n, g) => n + g.applications.filter((a) => a.status === 'pending').length, 0)
  const compat = new Map(
    await Promise.all(
      shown
        .filter(() => tab === 'open')
        .map(async (g) => [g.id, await compatibleBands(g)] as const),
    ),
  )
  // Candidatures de la date ouverte, triées par compatibilité.
  const candidates = selected
    ? await (async () => {
        const open = await bandsOpenOn(
          selected.applications.map((a) => a.bandId),
          selected.day,
        )
        return selected.applications
          .map((a) => ({ ...a, match: matchGig(selected, a.band, open.has(a.bandId)) }))
          .sort(
            (a, b) =>
              Number(b.status === 'pending') - Number(a.status === 'pending') ||
              Number(b.match.fits) - Number(a.match.fits),
          )
      })()
    : []
  const published = Number(sp.publie) || 0

  return (
    <section className={styles.page}>
      <div
        className="container"
        style={{ maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 }}
      >
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
            <Link href="/compte" className="label">
              ← {orga.name}
            </Link>
            <h1 className={`display ${styles.pageTitle}`} style={{ marginTop: 10 }}>
              {t('mine.title')}
            </h1>
          </div>
          <Link href="/compte/dates/nouvelle" className="btn btn--amber">
            {t('mine.publish')}
          </Link>
        </div>

        {published > 0 && (
          <div role="status" className={styles.banner}>
            <strong>{t('mine.published', { count: published })}</strong>
            <p style={{ margin: '6px 0 0' }}>{t('mine.publishedText')}</p>
          </div>
        )}
        {session.user.status !== 'active' && <p className={styles.banner}>{t('mine.pending')}</p>}

        <div className={styles.counters}>
          <div className={styles.counter}>
            <span className={styles.counterValue}>{counts.open}</span>
            <span className="label">{t('mine.counters.open')}</span>
          </div>
          <div className={styles.counter}>
            <span className={styles.counterValue}>{pendingCount}</span>
            <span className="label">{t('mine.counters.applications')}</span>
          </div>
        </div>

        <nav className={styles.tabs} aria-label={t('mine.title')}>
          {TABS.map((x) => (
            <Link
              key={x}
              href={{ pathname: '/compte/dates', query: { onglet: x } }}
              className={styles.tab}
              aria-current={x === tab ? 'page' : undefined}
            >
              {t(`mine.tabs.${x}`)} · {counts[x]}
            </Link>
          ))}
        </nav>

        {shown.length === 0 && <p className={styles.empty}>{t(`mine.empty.${tab}`)}</p>}

        {shown.map((g) => {
          const pending = g.applications.filter((a) => a.status === 'pending').length
          const isSelected = selected?.id === g.id
          const c = compat.get(g.id)
          return (
            <article key={g.id} className={styles.dateCard} id={`date-${g.id}`}>
              <div className={styles.dateRow}>
                <DayFormat day={g.day} className={styles.dateBlock} />
                <div className={styles.dateInfo}>
                  <span className={styles.dateTitle}>
                    {t(`format.${g.format}` as never)}
                    {g.venue ? ` · ${g.venue.name}` : ''}
                  </span>
                  <span className={styles.muted}>
                    {[
                      g.genres.map((x) => tg(x as never)).join(', '),
                      g.setLength ? t('ticket.minutes', { n: g.setLength }) : null,
                      g.format === 'bill' ? t('ticket.bands', { count: g.bandsCount }) : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <span className={styles.pills}>
                    <span className={`${styles.pill} ${pending ? styles.pillAmber : ''}`}>
                      {t('mine.applications', { count: pending })}
                    </span>
                    {c && (
                      <span className={styles.pill}>
                        {t('mine.compatible', { count: c.count })}
                      </span>
                    )}
                    {g.visibility === 'invite' && (
                      <span className={styles.pill}>{t('ticket.invite')}</span>
                    )}
                  </span>
                </div>
                {tab === 'open' && (
                  <div className={styles.actions}>
                    <Link
                      href={
                        isSelected
                          ? { pathname: '/compte/dates' }
                          : { pathname: '/compte/dates', query: { date: g.id } }
                      }
                      className="btn btn--amber"
                    >
                      {isSelected ? t('mine.hideApplications') : t('mine.seeApplications')}
                    </Link>
                    <Link
                      href={{ pathname: '/compte/dates/[id]', params: { id: g.id } }}
                      className="btn btn--ghost"
                    >
                      {t('mine.edit')}
                    </Link>
                    <Link
                      href={{ pathname: '/dates/[id]', params: { id: g.id } }}
                      className="btn btn--ghost"
                    >
                      {t('mine.view')}
                    </Link>
                    <ActionButton
                      action={cancelGig}
                      fields={{ gigId: g.id }}
                      label={t('mine.cancel')}
                      confirm={t('mine.cancelConfirm')}
                      className={styles.linkButton}
                    />
                  </div>
                )}
              </div>

              {isSelected && (
                <div className={styles.candidates}>
                  <div className={styles.candidateHead}>
                    <h2 className={styles.panelTitle}>{t('mine.candidates.title')}</h2>
                    {candidates.length > 1 && (
                      <span className={styles.muted}>{t('mine.candidates.sorted')}</span>
                    )}
                  </div>
                  {candidates.length === 0 && (
                    <p className={styles.muted}>{t('mine.candidates.none')}</p>
                  )}
                  {candidates.map((a) => (
                    <div key={a.id} className={styles.candidate}>
                      <div className={styles.candidateHead}>
                        <span className={styles.candidateName}>{a.band.name}</span>
                        {a.status === 'pending' ? (
                          a.match.fits && (
                            <span className={`${styles.pill} ${styles.pillAmber}`}>
                              {t('mine.candidates.fits')}
                            </span>
                          )
                        ) : (
                          <span className={styles.pill}>
                            {t(`mine.candidates.status.${a.status}` as never)}
                          </span>
                        )}
                      </div>
                      <span className={styles.muted}>
                        {[a.band.mainGenre, ...a.band.genres.filter((x) => x !== a.band.mainGenre)]
                          .slice(0, 3)
                          .map((x) => tg(x as never))
                          .join(', ')}{' '}
                        · {a.band.city}
                      </span>
                      {a.message && (
                        <p className={styles.quote}>{t('quote', { text: a.message })}</p>
                      )}
                      <span>
                        <span className="label" style={{ color: 'var(--c-faint)' }}>
                          {t('mine.candidates.fee')}
                        </span>{' '}
                        <strong>
                          <MoneyOrOpen value={a.fee} open={t('mine.candidates.feeOpen')} />
                        </strong>
                      </span>
                      <div className={styles.actions}>
                        {a.band.slug && (
                          <Link
                            href={{ pathname: '/groupes/[slug]', params: { slug: a.band.slug } }}
                            className="btn btn--ghost"
                          >
                            {t('mine.candidates.profile')}
                          </Link>
                        )}
                        <a
                          href={a.band.listenUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--ghost"
                        >
                          {t('mine.candidates.listen')}
                        </a>
                        {a.status === 'pending' && (
                          <ActionButton
                            action={declineApplication}
                            fields={{ applicationId: a.id }}
                            label={t('mine.candidates.decline')}
                            confirm={t('mine.candidates.declineConfirm')}
                            className={styles.linkButton}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {candidates.some((a) => a.status === 'pending') && (
                    <p className={styles.muted}>{t('mine.candidates.offerSoon')}</p>
                  )}
                  {c && c.count > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <h3 className="label" style={{ color: 'var(--c-amber)', margin: 0 }}>
                        {t('mine.suggest.title')}
                      </h3>
                      <p className={styles.muted}>{t('mine.suggest.intro')}</p>
                      <p style={{ margin: 0 }}>
                        {c.bands.map((b, i) => (
                          <span key={b.id}>
                            {i > 0 && ', '}
                            {b.slug ? (
                              <Link
                                href={{ pathname: '/groupes/[slug]', params: { slug: b.slug } }}
                              >
                                {b.name}
                              </Link>
                            ) : (
                              b.name
                            )}{' '}
                            <span className={styles.muted} style={{ display: 'inline' }}>
                              ({b.city})
                            </span>
                          </span>
                        ))}
                        {c.count > c.bands.length &&
                          ` ${t('mine.suggest.more', { count: c.count - c.bands.length })}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function MoneyOrOpen({ value, open }: { value: number | null; open: string }) {
  return value === null ? open : <ChfText value={value} />
}
