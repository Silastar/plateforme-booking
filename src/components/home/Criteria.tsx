import { getTranslations } from 'next-intl/server'

import styles from './home.module.css'

const KEYS = ['genre', 'place', 'date', 'fee'] as const

export async function Criteria() {
  const t = await getTranslations('home.criteria')
  return (
    <section aria-labelledby="criteria-title" className={styles.section}>
      <div className="container">
        <h2 id="criteria-title" className={`display ${styles.sectionTitle}`}>
          {t('titleLine1')}
          <br />
          <span className={styles.amber}>{t('titleLine2')}</span>
        </h2>
        <div className={styles.criteriaGrid}>
          {KEYS.map((k, i) => (
            <div key={k} className={styles.criterion}>
              <span className={styles.criterionNumber}>{String(i + 1).padStart(2, '0')}</span>
              <h3>{t(`${k}.title`)}</h3>
              <p>{t(`${k}.text`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
