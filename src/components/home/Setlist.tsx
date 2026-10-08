import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import styles from './home.module.css'

export async function Setlist() {
  const t = await getTranslations('home.setlist')
  const orga = t.raw('orga.items') as string[]
  const band = t.raw('band.items') as string[]
  return (
    <section id="setlist" aria-labelledby="setlist-title" className={styles.setlistSection}>
      <div className="container">
        <h2 id="setlist-title" className={`display ${styles.sectionTitle}`}>
          {t('title')}
        </h2>
        <div className={styles.setlists}>
          <div className={`${styles.setlist} ${styles.setlistLeft}`}>
            <span aria-hidden="true" className={styles.tapePiece} />
            <h3>{t('orga.title')}</h3>
            <ol>
              {orga.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <Link href="/orgas" className={styles.setlistLink}>
              {t('orga.link')}
            </Link>
          </div>
          <div className={`${styles.setlist} ${styles.setlistRight}`}>
            <span aria-hidden="true" className={styles.tapePiece} />
            <h3>{t('band.title')}</h3>
            <ol>
              {band.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
            <Link href="/groupes" className={styles.setlistLink}>
              {t('band.link')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
