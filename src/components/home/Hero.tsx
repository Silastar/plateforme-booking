import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import styles from './home.module.css'
import { StageLights } from './StageLights'

export async function Hero() {
  const t = await getTranslations('home.hero')
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <StageLights className={styles.lights} />
      <div className={`container ${styles.heroInner}`}>
        <div className={styles.heroText}>
          <span className="tape">{t('tag')}</span>
          <h1 id="hero-title" className={`display ${styles.heroTitle}`}>
            <span>{t('titleLine1')}</span>
            <span className={styles.heroTitleAccent}>{t('titleLine2')}</span>
          </h1>
          <p className={styles.lead}>{t('lead')}</p>
          <div className={styles.ctas}>
            <Link href="/inscription" className="btn btn--amber">
              {t('ctaOrga')}
            </Link>
            <Link href="/inscription" className="btn btn--red">
              {t('ctaBand')}
            </Link>
          </div>
        </div>
        <div className={styles.polaroidWrap}>
          <figure className={styles.polaroid} style={{ margin: 0 }}>
            <div className={styles.photoPlaceholder} role="img" aria-label={t('photoAlt')}>
              {t('photoAlt')}
            </div>
            <figcaption className={styles.polaroidCaption}>{t('photoCaption')}</figcaption>
            <span aria-hidden="true" className={styles.tapePiece} />
          </figure>
        </div>
      </div>
    </section>
  )
}
