'use client'

import { useTransition } from 'react'

import { useRouter } from '@/i18n/navigation'

// Lance une action serveur puis rafraîchit la page ; « pending » désactive les boutons pendant ce temps.
export function useMutation() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn()
      router.refresh()
    })
  return { pending, run }
}
