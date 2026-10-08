'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { Embed } from '@/lib/embeds'

import styles from './profile.module.css'

const SERVICE: Record<Embed['kind'], string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
}

// Le lecteur externe ne se charge qu'au clic : pas de cookie Spotify / YouTube avant (nLPD, RGPD).
export function MediaPlayer({ embed, title }: { embed: Embed; title: string }) {
  const t = useTranslations('profiles.media')
  const [on, setOn] = useState(false)
  const service = SERVICE[embed.kind]
  if (on) {
    return (
      <iframe
        className={styles.iframe}
        src={embed.src}
        title={`${title} · ${service}`}
        height={embed.height}
        loading="lazy"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    )
  }
  return (
    <div className={styles.facade}>
      <div className={styles.facadeText}>
        <strong>{t('play', { service })}</strong>
        <span className={styles.facadeNote}>{t('privacy', { service })}</span>
      </div>
      <button type="button" className="btn btn--red" onClick={() => setOn(true)}>
        {t('load')}
      </button>
    </div>
  )
}
