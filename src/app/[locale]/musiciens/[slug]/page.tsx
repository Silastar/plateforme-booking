import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { StageLights } from '@/components/home/StageLights'
import { MediaPlayer } from '@/components/profiles/MediaPlayer'
import styles from '@/components/profiles/profile.module.css'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { musicianBusyDays } from '@/lib/availability'
import { addDays, todayIso } from '@/lib/calendar'
import { embedFor } from '@/lib/embeds'
import type { Genre } from '@/lib/genres'
import { getMusicianPage } from '@/lib/musicians'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const m = await getMusicianPage(slug)
  return m ? { title: m.stageName } : {}
}

export default async function MusicianPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const m = await getMusicianPage(slug)
  if (!m) notFound()
  const session = await getSession()
  const isMe = session?.user.id === m.userId
  const t = await getTranslations('profiles')
  const ti = await getTranslations('auth.signup.profile.musicien')
  const tg = await getTranslations('genres')
  const format = await getFormatter()
  // Agenda : 14 prochains jours, « libre / occupé » seulement, pour les comptes connectés.
  const today = todayIso()
  const next14 = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const busy = session
    ? new Set((await musicianBusyDays(m.userId, next14[0], next14[13])).map((b) => b.day))
    : new Set<string>()
  const videos = [m.videoUrl, m.videoUrl2].map((u) => embedFor(u)).filter((e) => e !== null)
  const subFacts = [
    [t('musician.subInstruments'), m.subInstruments],
    [
      t('musician.subRadius'),
      m.subRadiusKm ? t('musician.km', { city: m.city, km: m.subRadiusKm }) : null,
    ],
    [
      t('musician.notice'),
      m.subNoticeDays !== null ? t('musician.days', { n: m.subNoticeDays }) : null,
    ],
    [t('musician.repertoire'), m.repertoireNote],
    [t('musician.gear'), m.gearNote],
  ].filter(([, v]) => v) as [string, string][]

  return (
    <article className={styles.accentGroupe}>
      <header className={styles.hero}>
        <StageLights className={styles.heroLights} />
        <div className={`container ${styles.heroInner}`}>
          {m.photo && (
            <figure
              style={{
                margin: 0,
                background: 'var(--c-paper)',
                padding: '12px 12px 40px',
                transform: 'rotate(-2.5deg)',
                position: 'relative',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photo}
                alt=""
                style={{ width: 210, height: 230, objectFit: 'cover', display: 'block' }}
              />
              <figcaption
                style={{
                  fontFamily: 'var(--font-marker)',
                  color: 'var(--c-ink)',
                  fontSize: 20,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                {m.stageName.split(' ')[0]} · {ti(`instruments.${m.mainInstrument}` as never)}
              </figcaption>
            </figure>
          )}
          <div className={styles.heroText}>
            <h1 className={`display ${styles.heroTitle}`}>{m.stageName}</h1>
            <ul className={styles.tags}>
              <li className="tape" style={{ background: 'var(--c-red)', color: '#fff' }}>
                {ti(`instruments.${m.mainInstrument}` as never)}
              </li>
              {m.otherInstruments && <li className="tape">{m.otherInstruments}</li>}
            </ul>
            <ul className={styles.meta}>
              <li>{m.city}</li>
              <li>{ti(`levels.${m.level}` as never)}</li>
              {m.styles.length > 0 && <li>{(m.styles as Genre[]).map((g) => tg(g)).join(', ')}</li>}
              {m.memberships.length > 0 && (
                <li>{t('musician.bandsCount', { count: m.memberships.length })}</li>
              )}
            </ul>
            {m.availableForSubs && (
              <span
                style={{
                  border: '2px solid var(--c-amber)',
                  color: 'var(--c-amber)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontSize: 13,
                  padding: '6px 10px',
                  transform: 'rotate(-2deg)',
                }}
              >
                {t('musician.available')}
              </span>
            )}
          </div>
          <div className={styles.heroActions}>
            {isMe && (
              <Link href="/compte/musicien" className="btn btn--paper">
                {t('edit')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={`container ${styles.body}`}>
        <div className={styles.main}>
          {m.memberships.length > 0 && (
            <section aria-labelledby="bands" className={styles.panel}>
              <h2 id="bands" className={styles.panelTitle}>
                {t('musician.bands')}
              </h2>
              <ul className={styles.members}>
                {m.memberships.map((b) => (
                  <li key={b.id} className={styles.member}>
                    <span className={styles.memberName}>{b.band.name}</span>
                    {b.role && <span className={styles.muted}>{b.role}</span>}
                    {b.isEssential && <span className={styles.badge}>{t('essential')}</span>}
                    {b.band.slug && (
                      <Link href={{ pathname: '/groupes/[slug]', params: { slug: b.band.slug } }}>
                        {t('musician.seeBand')}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {videos.length > 0 && (
            <section aria-labelledby="videos" className={styles.panel}>
              <h2 id="videos" className={styles.panelTitle}>
                {t('musician.hear')}
              </h2>
              <div className={styles.players}>
                {videos.map((v) => (
                  <MediaPlayer key={v.src} embed={v} title={m.stageName} />
                ))}
              </div>
            </section>
          )}
          {m.bio && (
            <section aria-labelledby="bio" className={styles.panel}>
              <h2 id="bio" className={styles.panelTitle}>
                {t('bio')}
              </h2>
              <p className={styles.prose}>{m.bio}</p>
            </section>
          )}
          {session && (
            <section aria-labelledby="agenda" className={styles.panel}>
              <h2 id="agenda" className={styles.panelTitle}>
                {t('musician.agenda')}
              </h2>
              <p className={styles.muted}>
                {isMe ? t('musician.agendaMine') : t('musician.agendaOthers')}
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 6,
                }}
              >
                {next14.map((d) => (
                  <li
                    key={d}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '10px 12px',
                      border: busy.has(d) ? '1px solid var(--c-line)' : '2px solid var(--c-amber)',
                      color: busy.has(d) ? 'var(--c-faint)' : 'var(--c-amber)',
                    }}
                  >
                    <span style={{ fontWeight: 800, color: 'var(--c-text)' }}>
                      {format.dateTime(new Date(`${d}T12:00:00Z`), {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        timeZone: 'UTC',
                      })}
                    </span>
                    <span className="label">
                      {busy.has(d) ? t('dispos.busy') : t('dispos.free')}
                    </span>
                  </li>
                ))}
              </ul>
              {isMe && (
                <Link
                  href="/compte/musicien/agenda"
                  className="btn btn--ghost"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {t('musician.manageAgenda')}
                </Link>
              )}
            </section>
          )}
          {m.availableForSubs && subFacts.length > 0 && (
            <section aria-labelledby="subs" className={styles.paper}>
              <span aria-hidden="true" className={`${styles.tape} ${styles.tapeLeft}`} />
              <div className={styles.paperHead}>
                <h2 id="subs" className={styles.paperTitle}>
                  {t('musician.subs')}
                </h2>
              </div>
              <dl className={styles.facts}>
                {subFacts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </div>
    </article>
  )
}
