import type messages from '../messages/fr.json'
import type { routing } from './i18n/routing'

// Clés de traduction typées : une clé absente de fr.json fait échouer la compilation.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof messages
  }
}
