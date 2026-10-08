import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { Genre } from '@/lib/genres'

import styles from './home.module.css'

type SampleDate = { date: string; genre: Genre; venue: string; city: string; capacity: number }

// Exemples affichés tant que la base ne contient pas de vraies dates (étape 5 du plan).
const SAMPLE_DATES: SampleDate[] = [
  { date: '2027-03-14', genre: 'rock', venue: 'Le Bocal', city: 'Fribourg', capacity: 250 },
  { date: '2027-03-22', genre: 'jazz', venue: 'Cave du Port', city: 'Neuchâtel', capacity: 90 },
  { date: '2027-04-05', genre: 'electro', venue: 'Hangar 12', city: 'Lausanne', capacity: 600 },
]

export async function OpenDates() {
  const t = await getTranslations('home.dates')
  const tg = await getTranslations('genres')
  const format = await getFormatter()

  return (
    <section aria-labelledby="dates-title" className={styles.section}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 id="dates-title" className={`display ${styles.sectionTitle}`}>
            {t('title')}
          </h2>
          <Link href="/dates" className={styles.headLink}>
            {t('all')}
          </Link>
        </div>
        <ul className={styles.tickets}>
          {SAMPLE_DATES.map((d) => {
            const day = new Date(`${d.date}T12:00:00`)
            return (
              <li key={d.date + d.venue} className={styles.ticket}>
                <div className={styles.ticketMain}>
                  <span className={`label ${styles.ticketKicker}`}>
                    {t('openDate', { weekday: format.dateTime(day, { weekday: 'long' }) })}
                  </span>
                  <span className={`display ${styles.ticketDate}`}>
                    {format.dateTime(day, { day: 'numeric', month: 'long' })}
                  </span>
                  <span className={styles.ticketVenue}>{d.venue}</span>
                  <span className={styles.ticketMeta}>
                    {d.city} · {t('capacity', { count: format.number(d.capacity) })}
                  </span>
                  <p className={styles.locked}>
                    <LockIcon />
                    {t('locked')}
                  </p>
                </div>
                <div aria-hidden="true" className={styles.perforation} />
                <div className={styles.ticketStubRow}>
                  <span className={styles.ticketGenre}>{tg(d.genre)}</span>
                  <Link href="/connexion" className={styles.ticketLink}>
                    {t('login')}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
        <p className={styles.note}>{t('sample')}</p>
      </div>
    </section>
  )
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}
