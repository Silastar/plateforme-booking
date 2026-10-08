import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ActionButton } from '@/components/gigs/ActionButton'
import { ApplyForm } from '@/components/gigs/ApplyForm'
import styles from '@/components/gigs/gigs.module.css'
import { GigTicket, toTicket } from '@/components/gigs/GigTicket'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { withdrawApplication } from '@/lib/actions/gigs'
import { getAdminBands } from '@/lib/bands'
import { todayIso } from '@/lib/calendar'
import { matchGig } from '@/lib/gig-rules'
import { bandsOpenOn, canSeeGig, getBandApplications, getGigPage } from '@/lib/gigs'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const g = await getGigPage(id)
  return g ? { title: `${g.organization.name} · ${g.day}`, robots: { index: false } } : {}
}

export default async function GigPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const g = await getGigPage(id)
  const session = await getSession()
  const viewer = session ? { id: session.user.id, role: session.user.role } : null
  if (!g || !canSeeGig(g, viewer)) notFound()

  const t = await getTranslations('gigs')
  const isOwner = viewer?.id === g.organization.ownerId
  const bands = session && !isOwner ? await getAdminBands(session.user.id) : []
  const mine = (await getBandApplications(bands.map((b) => b.id))).filter((a) => a.gigId === g.id)
  const open = await bandsOpenOn(
    bands.map((b) => b.id),
    g.day,
  )
  const past = g.day < todayIso()
  const accepting = g.status === 'open' && g.visibility === 'open' && !past
  const canApply = bands.filter(
    (b) => !mine.some((a) => a.bandId === b.id && a.status !== 'withdrawn'),
  )
  const v = g.venue
  const gear = v
    ? [
        v.paProvided && t('detail.gearItems.pa'),
        v.lightsProvided && t('detail.gearItems.lights'),
        v.engineerOnSite && t('detail.gearItems.engineer'),
        v.greenRoom && t('detail.gearItems.greenRoom'),
        v.catering && t('detail.gearItems.catering'),
      ].filter((x): x is string => Boolean(x))
    : []
  const statusNote =
    g.status === 'cancelled'
      ? t('detail.status.cancelled')
      : g.status === 'filled'
        ? t('detail.status.filled')
        : past
          ? t('detail.status.past')
          : null
  const mark = (value: boolean | null) =>
    value === null ? (
      <span className={styles.unknown}>?</span>
    ) : value ? (
      <span className={styles.yes}>✓</span>
    ) : (
      <span className={styles.no}>✕</span>
    )

  return (
    <section className={styles.page}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Link href="/dates" className="label">
          ← {t('detail.back')}
        </Link>
        {statusNote && <p className={`${styles.banner} ${styles.bannerRed}`}>{statusNote}</p>}
        {isOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {g.organization.owner.status !== 'active' && (
              <p className={styles.banner}>{t('detail.pendingOrga')}</p>
            )}
            {g.visibility === 'invite' && <p className={styles.banner}>{t('detail.inviteOnly')}</p>}
            <div>
              <Link
                href={{ pathname: '/compte/dates', query: { date: g.id } }}
                className="btn btn--amber"
              >
                {t('detail.manage')}
              </Link>
            </div>
          </div>
        )}
        <div className={styles.detailLayout}>
          <div>
            <GigTicket gig={toTicket(g)} unlocked={Boolean(session)} link="none" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <section className={styles.panel} aria-labelledby="by">
              <h2 id="by" className="label" style={{ color: 'var(--c-amber)' }}>
                {t('detail.by')}
              </h2>
              <p className="display" style={{ fontSize: 36, margin: 0 }}>
                {g.organization.name}
              </p>
              {g.organization.slug && (
                <Link
                  href={{ pathname: '/orgas/[slug]', params: { slug: g.organization.slug } }}
                  className="label"
                >
                  {t('detail.seeOrga')} →
                </Link>
              )}
              {session && g.note && (
                <>
                  <h3 className="label" style={{ color: 'var(--c-faint)', margin: '8px 0 0' }}>
                    {t('detail.note')}
                  </h3>
                  <p className={styles.quote}>{t('quote', { text: g.note })}</p>
                </>
              )}
              {session && v && (gear.length > 0 || v.backline || v.stageSize) && (
                <>
                  <h3 className="label" style={{ color: 'var(--c-faint)', margin: '8px 0 0' }}>
                    {t('detail.gear')}
                  </h3>
                  {gear.length > 0 && <p style={{ margin: 0 }}>{gear.join(' · ')}</p>}
                  {v.stageSize && (
                    <p className={styles.muted}>{t('detail.stage', { size: v.stageSize })}</p>
                  )}
                  {v.backline && (
                    <p className={styles.muted}>{t('detail.backline', { list: v.backline })}</p>
                  )}
                </>
              )}
            </section>

            {bands.map((b) => {
              const m = matchGig(g, b, open.has(b.id))
              return (
                <section key={b.id} className={styles.panel} aria-label={b.name}>
                  <h2 className={styles.panelTitle}>{t('detail.match.title', { band: b.name })}</h2>
                  <ul className={styles.checks}>
                    <li>
                      {mark(m.genre)}
                      {m.genre ? t('detail.match.genre') : t('detail.match.noGenre')}
                    </li>
                    <li>
                      {mark(m.money)}
                      {m.money === null
                        ? t('detail.match.moneyUnknown')
                        : m.money
                          ? t('detail.match.money')
                          : t('detail.match.noMoney')}
                    </li>
                    <li>
                      {mark(m.night)}
                      {m.night ? t('detail.match.night') : t('detail.match.noNight')}
                    </li>
                    <li>
                      {mark(null)}
                      {t('detail.match.place')}
                    </li>
                  </ul>
                </section>
              )
            })}

            {mine.map((a) => (
              <section key={a.id} className={styles.panel} aria-label={a.band.name}>
                <h2 className={styles.panelTitle}>{t('apply.yours', { band: a.band.name })}</h2>
                <p style={{ margin: 0, fontWeight: 800 }}>
                  {t(`apply.status.${a.status}` as never)}
                </p>
                {a.message && <p className={styles.quote}>{t('quote', { text: a.message })}</p>}
                {a.status === 'pending' && (
                  <div>
                    <ActionButton
                      action={withdrawApplication}
                      fields={{ applicationId: a.id }}
                      label={t('apply.withdraw')}
                    />
                  </div>
                )}
              </section>
            ))}

            {accepting && canApply.length > 0 && (
              <ApplyForm
                gigId={g.id}
                bands={canApply.map((b) => ({ id: b.id, name: b.name, feeMin: b.feeMin }))}
              />
            )}
            {accepting && !session && (
              <section className={styles.panel}>
                <h2 className={styles.panelTitle}>{t('apply.loginTitle')}</h2>
                <p className={styles.muted}>{t('apply.loginText')}</p>
                <div>
                  <Link href="/connexion" className="btn btn--red">
                    {t('apply.login')}
                  </Link>
                </div>
              </section>
            )}
            {accepting && session && !isOwner && bands.length === 0 && (
              <p className={styles.empty}>{t('apply.noBand')}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
