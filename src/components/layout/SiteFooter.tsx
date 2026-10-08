import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

import styles from './layout.module.css'

export async function SiteFooter() {
  const t = await getTranslations()
  return (
    <footer className={styles.footer}>
      <span className={styles.footerName}>{t('meta.siteName')}</span>
      <nav aria-label={t('a11y.legalNav')} className={styles.footerLinks}>
        <Link href="/conditions">{t('footer.terms')}</Link>
        <Link href="/confidentialite">{t('footer.privacy')}</Link>
        <Link href="/contact">{t('footer.contact')}</Link>
      </nav>
    </footer>
  )
}
