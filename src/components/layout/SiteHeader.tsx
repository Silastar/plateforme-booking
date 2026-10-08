import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { getSession } from '@/lib/session'

import styles from './layout.module.css'
import { LocaleSwitcher } from './LocaleSwitcher'

export async function SiteHeader() {
  const t = await getTranslations()
  const session = await getSession()
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        {t('meta.siteName')}
      </Link>
      <nav aria-label={t('a11y.mainNav')} className={styles.nav}>
        <Link href="/groupes" className={styles.navLink}>
          {t('nav.bands')}
        </Link>
        {session?.user.role === 'orga' ? (
          <Link href="/compte/dates" className={styles.navLink}>
            {t('nav.myDates')}
          </Link>
        ) : (
          <Link href="/dates" className={styles.navLink}>
            {t('nav.openDates')}
          </Link>
        )}
        <Link href={{ pathname: '/', hash: 'setlist' }} className={styles.navLink}>
          {t('nav.howItWorks')}
        </Link>
        <Link href="/tarifs" className={styles.navLink}>
          {t('nav.pricing')}
        </Link>
        {session ? (
          <Link href="/compte" className={`btn btn--paper ${styles.navCta}`}>
            {t('nav.account')}
          </Link>
        ) : (
          <>
            <Link href="/connexion" className={styles.navLink}>
              {t('nav.login')}
            </Link>
            <Link href="/inscription" className={`btn btn--red ${styles.navCta}`}>
              {t('nav.signup')}
            </Link>
          </>
        )}
        <LocaleSwitcher label={t('a11y.language')} />
      </nav>
    </header>
  )
}
