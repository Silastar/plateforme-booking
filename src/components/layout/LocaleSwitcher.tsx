'use client'

import { useParams } from 'next/navigation'
import { useLocale } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

import styles from './layout.module.css'

export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const params = useParams()

  return (
    <div role="group" aria-label={label} className={styles.locales}>
      {routing.locales.map((l) =>
        l === locale ? (
          <span key={l} aria-current="true" className={`${styles.locale} ${styles.localeCurrent}`}>
            {l.toUpperCase()}
          </span>
        ) : (
          <Link
            key={l}
            // Même page dans l'autre langue (l'adresse traduite est calculée par next-intl).
            href={{ pathname, params } as never}
            locale={l}
            hrefLang={l}
            className={styles.locale}
          >
            {l.toUpperCase()}
          </Link>
        ),
      )}
    </div>
  )
}
