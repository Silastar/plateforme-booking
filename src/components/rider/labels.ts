import { useTranslations } from 'next-intl'

import { MIC_TOKENS } from '@/lib/rider-catalog'

// Libellés traduits des micros (jetons DI…), pieds et retours.
export function useRiderLabels() {
  const t = useTranslations('rider')
  return {
    mic: (m: string) =>
      (MIC_TOKENS as readonly string[]).includes(m) ? t(`mics.${m}` as never) : m || '—',
    stand: (s: string) => t(`stands.${s}` as never),
    monitor: (m: string) => t(`monitors.${m}` as never),
  }
}
