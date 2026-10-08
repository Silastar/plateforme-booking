import { getTranslations } from 'next-intl/server'

import { GigTicket, toTicket } from '@/components/gigs/GigTicket'
import { Link } from '@/i18n/navigation'
import { getOpenGigs } from '@/lib/gigs'
import { getSession } from '@/lib/session'

import styles from './home.module.css'

// Les prochaines dates ouvertes. Budget et détails seulement pour les membres connectés.
export async function OpenDates() {
  const t = await getTranslations('home.dates')
  const [gigs, session] = await Promise.all([getOpenGigs(3), getSession()])

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
        {gigs.length === 0 ? (
          <p className={styles.note}>{t('empty')}</p>
        ) : (
          <ul className={styles.tickets}>
            {gigs.map((g) => (
              <li key={g.id}>
                <GigTicket
                  gig={toTicket(g)}
                  unlocked={Boolean(session)}
                  link={session ? 'view' : 'login'}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
