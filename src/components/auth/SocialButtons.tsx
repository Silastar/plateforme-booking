'use client'

import { useTranslations } from 'next-intl'

import { authClient } from '@/lib/auth-client'

import styles from './auth.module.css'

const LABELS: Record<string, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  facebook: 'Facebook',
  apple: 'Apple',
}

// Boutons « Continuer avec … » : seulement pour les fournisseurs configurés sur le serveur.
export function SocialButtons({
  providers,
  callbackURL,
}: {
  providers: string[]
  callbackURL: string
}) {
  const t = useTranslations('auth.social')
  if (providers.length === 0) return null
  return (
    <div className={styles.social}>
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          className={styles.socialButton}
          onClick={() =>
            authClient.signIn.social({
              provider: p as 'google',
              callbackURL,
              newUserCallbackURL: callbackURL,
            })
          }
        >
          {t('continueWith', { provider: LABELS[p] ?? p })}
        </button>
      ))}
    </div>
  )
}
