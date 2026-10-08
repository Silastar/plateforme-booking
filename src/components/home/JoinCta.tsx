import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import styles from './home.module.css'

export async function JoinCta() {
  const t = await getTranslations('home.join')
  return (
    <section aria-labelledby="join-title" className={styles.join}>
      <div className={`container ${styles.joinInner}`}>
        <div>
          <h2 id="join-title" className={`display ${styles.joinTitle}`}>
            {t('title')}
          </h2>
          <p className={styles.joinText}>{t('text')}</p>
        </div>
        <div className={styles.ctas}>
          <Link href="/inscription" className="btn btn--ink">
            {t('orga')}
          </Link>
          <Link href="/inscription" className="btn btn--paper">
            {t('band')}
          </Link>
        </div>
      </div>
    </section>
  )
}
