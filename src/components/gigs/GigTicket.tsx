import { useTranslations } from 'next-intl'

import { LockIcon } from '@/components/profiles/LockedNote'
import { Link } from '@/i18n/navigation'

import { useGigFormat } from './format'
import styles from './gigs.module.css'

export type TicketData = {
  id: string
  day: string
  genres: string[]
  format: string
  bandsCount: number
  setLength: number | null
  budgetMin: number | null
  budgetMax: number | null
  includes: string[]
  loadIn: string | null
  setStart: string | null
  curfew: string | null
  orgaName: string
  venueName: string | null
  city: string
  capacity: number | null
}

// Billet d'une date ouverte. Sans compte, budget et détails restent masqués.
// « link » : candidater (groupe), voir la date, se connecter, décor de l'aperçu, ou rien.
export function GigTicket({
  gig,
  unlocked,
  badge,
  link,
}: {
  gig: TicketData
  unlocked: boolean
  badge?: { label: string; muted?: boolean }
  link: 'apply' | 'view' | 'login' | 'preview' | 'none'
}) {
  const t = useTranslations('gigs.ticket')
  const tf = useTranslations('gigs.format')
  const ti = useTranslations('gigs.includes')
  const tg = useTranslations('genres')
  const f = useGigFormat()

  const wanted = [
    tf(gig.format as never),
    gig.format === 'bill' ? t('bands', { count: gig.bandsCount }) : null,
    gig.setLength ? t('minutes', { n: gig.setLength }) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const hours = [
    gig.loadIn && t('loadIn', { time: f.time(gig.loadIn) }),
    gig.setStart && t('setStart', { time: f.time(gig.setStart) }),
    gig.curfew && t('curfew', { time: f.time(gig.curfew) }),
  ]
    .filter(Boolean)
    .join(' · ')
  const included = gig.includes
    .map((x, i) => (i ? ti(x as never).toLocaleLowerCase() : ti(x as never)))
    .join(', ')
  const href = { pathname: '/dates/[id]' as const, params: { id: gig.id } }

  return (
    <article className={styles.ticket}>
      {badge && (
        <span className={`${styles.badge} ${badge.muted ? styles.badgeMuted : ''}`}>
          {badge.label}
        </span>
      )}
      <div className={styles.ticketMain}>
        <span className={`label ${styles.kicker}`}>
          {t('openDate', { weekday: f.day(gig.day, { weekday: 'long' }) })}
        </span>
        <span className={`display ${styles.date}`}>
          {f.day(gig.day, { day: 'numeric', month: 'long' })}
        </span>
        <span className={styles.venue}>
          {gig.orgaName}
          {gig.venueName ? ` · ${gig.venueName}` : ''}
        </span>
        <span className={styles.meta}>
          {gig.city}
          {gig.capacity ? ` · ${t('capacity', { count: gig.capacity })}` : ''}
        </span>
        {unlocked ? (
          <dl className={styles.details}>
            <dt>{t('budget')}</dt>
            <dd>{f.budget(gig.budgetMin, gig.budgetMax)}</dd>
            <dt>{t('wanted')}</dt>
            <dd>{wanted}</dd>
            {hours && (
              <>
                <dt>{t('hours')}</dt>
                <dd>{hours}</dd>
              </>
            )}
            {included && (
              <>
                <dt>{t('included')}</dt>
                <dd>{included}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className={styles.locked}>
            <LockIcon />
            {t('locked')}
          </p>
        )}
      </div>
      <div aria-hidden="true" className={styles.perforation} />
      <div className={styles.stub}>
        <span className={styles.genre}>
          {gig.genres
            .slice(0, 2)
            .map((g) => tg(g as never))
            .join(' · ')}
        </span>
        {link === 'login' && (
          <Link href="/connexion" className={styles.stubLink}>
            {t('login')}
          </Link>
        )}
        {(link === 'apply' || link === 'view') && (
          <Link href={href} className={styles.stubLink}>
            {link === 'apply' ? t('apply') : t('view')}
          </Link>
        )}
        {link === 'preview' && (
          <span className={styles.stubLink} aria-hidden="true">
            {t('apply')}
          </span>
        )}
      </div>
    </article>
  )
}

// Données d'un billet à partir d'une date chargée avec son lieu et son orga.
export function toTicket(g: {
  id: string
  day: string
  genres: string[]
  format: string
  bandsCount: number
  setLength: number | null
  budgetMin: number | null
  budgetMax: number | null
  includes: string[]
  loadIn: string | null
  setStart: string | null
  curfew: string | null
  venue: { name: string; city: string; capacity: number | null } | null
  organization: { name: string; city: string; capacity: number | null }
}): TicketData {
  return {
    id: g.id,
    day: g.day,
    genres: g.genres,
    format: g.format,
    bandsCount: g.bandsCount,
    setLength: g.setLength,
    budgetMin: g.budgetMin,
    budgetMax: g.budgetMax,
    includes: g.includes,
    loadIn: g.loadIn,
    setStart: g.setStart,
    curfew: g.curfew,
    orgaName: g.organization.name,
    venueName: g.venue?.name ?? null,
    city: g.venue?.city ?? g.organization.city,
    capacity: g.venue?.capacity ?? g.organization.capacity,
  }
}
