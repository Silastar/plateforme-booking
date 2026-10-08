import { getTranslations } from 'next-intl/server'

import { StageLights } from '@/components/home/StageLights'

import styles from './auth.module.css'

export async function AuthShell({
  children,
  narrow = false,
}: {
  children: React.ReactNode
  narrow?: boolean
}) {
  const t = await getTranslations('auth.poster')
  return (
    <div className={styles.shell}>
      <section aria-hidden="true" className={styles.poster}>
        <StageLights className={styles.posterLights} />
        <div className={styles.posterText}>
          <span className="tape">{t('tag')}</span>
          <p className={`display ${styles.posterTitle}`} style={{ margin: 0 }}>
            <span>{t('line1')}</span>
            <span>{t('line2')}</span>
            <span className={styles.red}>{t('line3')}</span>
          </p>
        </div>
        <div className={styles.posterPhoto}>
          <div>{t('photo')}</div>
          <p>{t('caption')}</p>
          <span className={styles.tapePiece} />
        </div>
      </section>
      <div className={styles.content}>
        <div className={`${styles.contentInner} ${narrow ? styles.contentNarrow : ''}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
