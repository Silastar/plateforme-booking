'use client'

import { useRouter } from '@/i18n/navigation'
import { authClient } from '@/lib/auth-client'

export function LogoutButton({ label }: { label: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      className="btn btn--ghost"
      onClick={async () => {
        await authClient.signOut()
        router.push('/')
        router.refresh()
      }}
    >
      {label}
    </button>
  )
}
