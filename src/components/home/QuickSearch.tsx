import { getLocale, getTranslations } from 'next-intl/server'

import { getPathname } from '@/i18n/navigation'
import { SEARCH_GENRES } from '@/lib/genres'

import styles from './home.module.css'

export async function QuickSearch() {
  const t = await getTranslations('home.search')
  const tg = await getTranslations('genres')
  const locale = await getLocale()
  const action = getPathname({ locale, href: '/groupes' })

  return (
    <section aria-label={t('label')} className={styles.searchSection}>
      <form action={action} method="get" className={`container ${styles.ticketForm}`}>
        <div className={styles.ticketStub}>
          <span className="label">{t('pass')}</span>
          <span className={`display ${styles.ticketTitle}`}>
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
          </span>
        </div>
        <div className={styles.ticketFields}>
          <label className={styles.field}>
            {t('genre')}
            <select name="genre" defaultValue="">
              <option value="">{tg('all')}</option>
              {SEARCH_GENRES.map((g) => (
                <option key={g} value={g}>
                  {tg(g)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            {t('place')}
            <input
              type="text"
              name="lieu"
              placeholder={t('placePlaceholder')}
              autoComplete="address-level2"
            />
          </label>
          <label className={styles.field}>
            {t('date')}
            <input type="date" name="date" />
          </label>
          <button type="submit" className="btn btn--ink" style={{ minHeight: 50 }}>
            {t('submit')}
          </button>
        </div>
      </form>
    </section>
  )
}
