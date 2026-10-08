import { getTranslations } from 'next-intl/server'

import { GENRES } from '@/lib/genres'

import styles from './home.module.css'

export async function GenreMarquee() {
  const t = await getTranslations('genres')
  const line = GENRES.map((g) => t(g)).join(' • ') + ' •'
  return (
    <div aria-hidden="true" className={styles.marquee}>
      {/* Deux copies identiques : l'animation glisse de la moitié pour boucler sans saut. */}
      <div className={styles.marqueeTrack}>
        <span>{line}</span>
        <span>{line}</span>
      </div>
    </div>
  )
}
