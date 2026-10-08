import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { StageLights } from '@/components/home/StageLights'
import { LockIcon } from '@/components/profiles/LockedNote'
import styles from '@/components/profiles/profile.module.css'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import type { Genre } from '@/lib/genres'
import { getOrgaPage } from '@/lib/orgas'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const orga = await getOrgaPage(slug)
  return orga ? { title: orga.name, description: orga.description ?? undefined } : {}
}

export default async function OrgaPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const orga = await getOrgaPage(slug)
  if (!orga) notFound()
  const session = await getSession()
  const isOwner = session?.user.id === orga.ownerId
  const isAdmin = session?.user.role === 'admin'
  // Tant que l'équipe n'a pas validé l'orga, sa page n'est visible que d'elle-même (et de l'équipe).
  if (orga.owner.status !== 'active' && !isOwner && !isAdmin) notFound()

  const t = await getTranslations('profiles')
  const tt = await getTranslations('auth.signup.profile.orga.types')
  const tg = await getTranslations('genres')
  const format = await getFormatter()
  const canSeeBudget = Boolean(session)
  const program = [
    [t('orga.eventTypes'), orga.eventTypes],
    [t('orga.bandsPerNight'), orga.bandsPerNight],
    [t('orga.setLength'), orga.setLength],
    [t('orga.rhythm'), orga.rhythm],
  ].filter(([, v]) => v) as [string, string][]
  const yes = t('orga.yes')

  return (
    <article className={styles.accentOrga}>
      <header className={styles.hero}>
        {orga.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={orga.cover} alt="" className={styles.heroPhoto} />
        ) : (
          <StageLights className={styles.heroLights} />
        )}
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <span className="tape" style={{ background: 'var(--c-amber)' }}>
              {tt(orga.type as never)}
            </span>
            <h1 className={`display ${styles.heroTitle}`}>{orga.name}</h1>
            <ul className={styles.meta}>
              <li>{orga.city}</li>
              {orga.since && <li>{t('orga.since', { year: orga.since })}</li>}
              {orga.website && (
                <li>
                  <a href={orga.website} target="_blank" rel="noopener">
                    {t('orga.website')} ↗
                  </a>
                </li>
              )}
            </ul>
            {orga.description && (
              <p className={styles.prose} style={{ maxWidth: 640, color: 'var(--c-text-soft)' }}>
                {orga.description}
              </p>
            )}
            {orga.owner.status === 'pending' && (
              <p className="tape" style={{ background: 'var(--c-red)', color: '#fff' }}>
                {t('orga.pending')}
              </p>
            )}
          </div>
          <div className={styles.heroActions}>
            {orga.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orga.logo}
                alt={t('orga.logoAlt', { name: orga.name })}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  background: 'var(--c-paper)',
                }}
              />
            )}
            {isOwner && (
              <Link href="/compte/orga" className="btn btn--paper">
                {t('edit')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        <div className={styles.main}>
          {(orga.genres.length > 0 || program.length > 0) && (
            <section aria-labelledby="program" className={styles.panel}>
              <h2 id="program" className={styles.panelTitle}>
                {t('orga.program')}
              </h2>
              {orga.genres.length > 0 && (
                <ul className={styles.tags}>
                  {(orga.genres as Genre[]).map((g) => (
                    <li key={g} className="tape">
                      {tg(g)}
                    </li>
                  ))}
                </ul>
              )}
              {program.length > 0 && (
                <dl className={`${styles.facts} ${styles.darkFacts}`}>
                  {program.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          )}

          {orga.venues.map((v) => {
            const facts = [
              [t('venue.capacity'), v.capacity ? t('venue.places', { count: v.capacity }) : null],
              [t('venue.stage'), v.stageSize],
              [t('venue.pa'), v.paProvided || v.lightsProvided ? yes : null],
              [t('venue.backline'), v.backline],
              [t('venue.engineer'), v.engineerOnSite ? t('venue.onSite') : null],
              [t('venue.greenRoom'), v.greenRoom || v.catering ? yes : null],
              [
                t('venue.times'),
                [
                  v.loadIn && t('venue.loadIn', { time: v.loadIn }),
                  v.curfew && t('venue.curfew', { time: v.curfew }),
                ]
                  .filter(Boolean)
                  .join(' · ') || null,
              ],
            ].filter(([, x]) => x) as [string, string][]
            return (
              <section key={v.id} aria-label={v.name} className={styles.paper}>
                <span aria-hidden="true" className={`${styles.tape} ${styles.tapeLeft}`} />
                <div className={styles.paperHead}>
                  <h2 className={styles.paperTitle}>{v.name}</h2>
                  <span>
                    {session && v.address ? `${v.address}, ` : ''}
                    {v.postalCode ? `${v.postalCode} ` : ''}
                    {v.city} · {v.indoor ? t('venue.indoor') : t('venue.outdoor')}
                  </span>
                </div>
                {v.photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.photo}
                    alt=""
                    style={{ width: '100%', maxHeight: 320, objectFit: 'cover' }}
                  />
                )}
                {facts.length > 0 && (
                  <dl className={styles.facts}>
                    {facts.map(([k, x]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{x}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            )
          })}
        </div>

        <aside className={styles.aside}>
          {(orga.budgetMin || orga.budgetMax || orga.feeTerms) && (
            <section
              aria-labelledby="terms"
              className={styles.panel}
              style={{ borderTop: '6px solid var(--c-amber)' }}
            >
              <h2 id="terms" className="label" style={{ color: 'var(--c-amber)' }}>
                {t('orga.terms')}
              </h2>
              {canSeeBudget ? (
                <>
                  {(orga.budgetMin || orga.budgetMax) && (
                    <p className="display" style={{ fontSize: 38, margin: 0 }}>
                      {orga.budgetMin && orga.budgetMax
                        ? t('fee.range', {
                            min: format.number(orga.budgetMin),
                            max: format.number(orga.budgetMax),
                          })
                        : t('fee.single', {
                            amount: format.number((orga.budgetMin ?? orga.budgetMax)!),
                          })}
                    </p>
                  )}
                  {orga.feeTerms && <p className={styles.muted}>{orga.feeTerms}</p>}
                </>
              ) : (
                <p className={`${styles.muted} ${styles.locked}`}>
                  <LockIcon />
                  {t('orga.termsLocked')}
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </article>
  )
}
