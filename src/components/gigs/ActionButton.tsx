'use client'

import { useTranslations } from 'next-intl'

import { useEditForm } from '@/components/profiles/SaveBar'
import type { FormState } from '@/lib/actions/types'

// Bouton qui envoie une action serveur (retirer, décliner, annuler…), avec confirmation facultative.
export function ActionButton({
  action,
  fields,
  label,
  confirm,
  className = 'btn btn--ghost',
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>
  fields: Record<string, string>
  label: string
  confirm?: string
  className?: string
}) {
  const t = useTranslations('forms')
  const { state, pending, onSubmit, formRef } = useEditForm(action)
  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) {
          e.preventDefault()
          return
        }
        onSubmit(e)
      }}
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}
    >
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="submit" className={className} disabled={pending}>
        {label}
      </button>
      {state.status === 'error' && (
        <span role="alert" style={{ color: 'var(--c-red-text)', fontSize: 14, fontWeight: 700 }}>
          {t(`errors.${state.errors.form ?? 'server'}` as never)}
        </span>
      )}
    </form>
  )
}
