import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { StageLights } from '@/components/home/StageLights'
import { LockIcon } from '@/components/profiles/LockedNote'
import { MediaPlayer } from '@/components/profiles/MediaPlayer'
import styles from '@/components/profiles/profile.module.css'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { bandAvailability, bandTours } from '@/lib/availability'
import { getBandPage } from '@/lib/bands'
import { addDays, todayIso } from '@/lib/calendar'
import { embedFor } from '@/lib/embeds'
import type { Genre } from '@/lib/genres'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const band = await getBandPage(slug)
  return band ? { title: band.name, description: band.bio ?? undefined } : {}
}

export default async function BandPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const band = await getBandPage(slug)
  if (!band) notFound()

  const t = await getTranslations('profiles')
  const tg = await getTranslations('genres')
  const format = await getFormatter()
  const session = await getSession()
  const viewerId = session?.user.id
  const viewerRole = session?.user.role ?? null
  const isMember = band.members.some((m) => m.userId && m.userId === viewerId)
  const isAdmin = band.members.some((m) => m.userId === viewerId && m.isAdmin)
  // Cachet : orgas connectés, équipe et membres du groupe. Fiche technique : tout compte connecté.
  const canSeeFee = isMember || viewerRole === 'orga' || viewerRole === 'admin'
  const canSeeRider = Boolean(session)
  // Dispos : prochains soirs cochés par le groupe (4 mois), pour les orgas connectés et le groupe.
  const today = todayIso()
  const nextDays = Array.from({ length: 120 }, (_, i) => addDays(today, i))
  const [availability, tours] = canSeeFee
    ? await Promise.all([bandAvailability(band.id, nextDays), bandTours(band.id)])
    : [[], []]
  const dispos = availability.filter((d) => d.state === 'open')
  const upcomingTours = tours.filter((x) => x.endDate >= today).slice(0, 3)
  const dayFmt = (d: string) =>
    format.dateTime(new Date(`${d}T12:00:00Z`), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    })

  const genres = [band.mainGenre, ...band.genres.filter((g) => g !== band.mainGenre)] as Genre[]
  const players = [band.spotifyUrl, band.youtubeUrl, band.soundcloudUrl]
    .map((u) => embedFor(u))
    .filter((e) => e !== null)
  const money = (n: number) => format.number(n)
  const techFacts = [
    [t('tech.lineup'), band.lineupDetail],
    [t('tech.backline'), band.backline],
    [t('tech.sound'), band.ownEngineer ? t('tech.ownEngineer') : null],
    [t('tech.setup'), band.setupMinutes ? t('minutes', { n: band.setupMinutes }) : null],
    [
      t('tech.set'),
      band.setMin && band.setMax
        ? t('setRange', { min: band.setMin, max: band.setMax })
        : band.setMin || band.setMax
          ? t('minutes', { n: (band.setMin ?? band.setMax)! })
          : null,
    ],
    [t('tech.minStage'), band.minStage],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <article className={styles.accentGroupe}>
      <header className={styles.hero}>
        {band.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={band.photo} alt="" className={styles.heroPhoto} />
        ) : (
          <StageLights className={styles.heroLights} />
        )}
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <h1 className={`display ${styles.heroTitle}`}>{band.name}</h1>
            <ul className={styles.tags} aria-label={t('genres')}>
              {genres.map((g) => (
                <li key={g} className="tape">
                  {tg(g)}
                </li>
              ))}
              {band.repertoire && (
                <li className="tape">{t(`repertoire.${band.repertoire}` as never)}</li>
              )}
            </ul>
            <ul className={styles.meta}>
              <li>{band.city}</li>
              {band.musiciansCount && <li>{t('musicians', { count: band.musiciansCount })}</li>}
              {band.since && <li>{t('since', { year: band.since })}</li>}
            </ul>
          </div>
          <div className={styles.heroActions}>
            {isAdmin && (
              <Link
                href={{ pathname: '/compte/groupe/[id]', params: { id: band.id } }}
                className="btn btn--paper"
              >
                {t('edit')}
              </Link>
            )}
            <a href={band.listenUrl} target="_blank" rel="noopener" className="btn btn--ghost">
              {t('listenOutside')}
            </a>
          </div>
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        <div className={styles.main}>
          <section aria-labelledby="ecouter" className={styles.panel}>
            <h2 id="ecouter" className={styles.panelTitle}>
              {t('listen')}
            </h2>
            {players.length > 0 && (
              <div className={styles.players}>
                {players.map((p) => (
                  <MediaPlayer key={p.src} embed={p} title={band.name} />
                ))}
              </div>
            )}
            <div className={styles.links}>
              <a href={band.listenUrl} target="_blank" rel="noopener">
                {t('mainLink')} ↗
              </a>
              {band.bandcampUrl && (
                <a href={band.bandcampUrl} target="_blank" rel="noopener">
                  Bandcamp ↗
                </a>
              )}
            </div>
          </section>

          {band.members.length > 0 && (
            <section aria-labelledby="lineup" className={styles.panel}>
              <h2 id="lineup" className={styles.panelTitle}>
                {t('lineup')}
              </h2>
              <ul className={styles.members}>
                {band.members.map((m) => {
                  const mus = m.user?.musician
                  const name = mus?.stageName ?? m.user?.name ?? m.name ?? '—'
                  return (
                    <li key={m.id} className={styles.member}>
                      <span className={styles.memberName}>{name}</span>
                      {m.role && <span className={styles.muted}>{m.role}</span>}
                      {m.isEssential && <span className={styles.badge}>{t('essential')}</span>}
                      {mus?.slug && (
                        <Link href={{ pathname: '/musiciens/[slug]', params: { slug: mus.slug } }}>
                          {t('profileLink')}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {(band.bio || band.story || band.discography || band.press) && (
            <section aria-labelledby="bio" className={styles.panel}>
              <h2 id="bio" className={styles.panelTitle}>
                {t('bio')}
              </h2>
              {band.bio && (
                <p className={styles.prose} style={{ fontWeight: 700 }}>
                  {band.bio}
                </p>
              )}
              {band.story && <p className={styles.prose}>{band.story}</p>}
              {band.discography && (
                <p className={styles.muted} style={{ whiteSpace: 'pre-line' }}>
                  <strong>{t('discography')} : </strong>
                  {band.discography}
                </p>
              )}
              {band.press && (
                <p className={styles.muted} style={{ whiteSpace: 'pre-line' }}>
                  <strong>{t('press')} : </strong>
                  {band.press}
                </p>
              )}
            </section>
          )}

          {(techFacts.length > 0 || band.rider) && (
            <section aria-labelledby="tech" className={styles.paper}>
              <span aria-hidden="true" className={`${styles.tape} ${styles.tapeLeft}`} />
              <span aria-hidden="true" className={`${styles.tape} ${styles.tapeRight}`} />
              <div className={styles.paperHead}>
                <h2 id="tech" className={styles.paperTitle}>
                  {t('tech.title')}
                </h2>
                {band.rider &&
                  (canSeeRider ? (
                    <a
                      href={band.rider}
                      target="_blank"
                      rel="noopener"
                      className={styles.paperLink}
                    >
                      {t('tech.pdf')} ↓
                    </a>
                  ) : (
                    <span className={styles.locked}>
                      <LockIcon />
                      {t('tech.pdfLocked')}
                    </span>
                  ))}
              </div>
              {techFacts.length > 0 && (
                <dl className={styles.facts}>
                  {techFacts.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          )}
        </div>

        <aside className={styles.aside}>
          {(band.feeMin || band.feeMax) && (
            <section aria-labelledby="fee" className={styles.ticket}>
              <div className={styles.ticketMain}>
                <h2 id="fee" className={`label ${styles.ticketLabel}`}>
                  {t('fee.title')}
                </h2>
                {canSeeFee ? (
                  <>
                    <p className={styles.ticketAmount} style={{ margin: 0 }}>
                      {band.feeMin && band.feeMax
                        ? t('fee.range', { min: money(band.feeMin), max: money(band.feeMax) })
                        : t('fee.single', { amount: money((band.feeMin ?? band.feeMax)!) })}
                    </p>
                    {band.feeNote && <p className={styles.ticketNote}>{band.feeNote}</p>}
                  </>
                ) : (
                  <p className={`${styles.ticketNote} ${styles.locked}`}>
                    <LockIcon />
                    {t('fee.locked')}
                  </p>
                )}
              </div>
              <div aria-hidden="true" className={styles.perforation} />
              <p className={styles.ticketStub}>{band.name}</p>
            </section>
          )}

          {canSeeFee && (
            <section aria-labelledby="dispos" className={styles.panel}>
              <h2 id="dispos" className={styles.asideTitle}>
                {t('dispos.title')}
              </h2>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {dispos.length === 0 && (
                  <li className={styles.muted}>
                    {isMember ? t('dispos.noneMember') : t('dispos.none')}
                  </li>
                )}
                {dispos.slice(0, 6).map((d) => (
                  <li
                    key={d.day}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '10px 12px',
                      border: '2px solid var(--c-amber)',
                      color: 'var(--c-amber)',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>{dayFmt(d.day)}</span>
                    <span className="label">{t('dispos.open')}</span>
                  </li>
                ))}
                {upcomingTours.map((x) => (
                  <li
                    key={x.id}
                    style={{ padding: '10px 12px', border: '2px dashed var(--c-faint)' }}
                  >
                    <strong>
                      {t('dispos.tour', { from: dayFmt(x.startDate), to: dayFmt(x.endDate) })}
                    </strong>
                    <div className={styles.muted}>{x.region}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(band.radiusKm || band.regions) && (
            <section aria-labelledby="zone" className={styles.panel}>
              <h2 id="zone" className={styles.asideTitle}>
                {t('zone.title')}
              </h2>
              <p className={styles.muted}>
                {band.radiusKm
                  ? t('zone.radius', { city: band.city, km: band.radiusKm })
                  : band.city}
                {band.regions ? ` ${t('zone.beyond', { regions: band.regions })}` : ''}
              </p>
            </section>
          )}
        </aside>
      </div>
    </article>
  )
}
