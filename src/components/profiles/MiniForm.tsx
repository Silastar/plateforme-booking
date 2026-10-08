'use client'

import { useTranslations } from 'next-intl'

import { formStyles as styles } from '@/components/forms/fields'
import type { FormState } from '@/lib/actions/types'

import { useEditForm } from './SaveBar'

// Petit formulaire d'action (accepter, retirer, inviter…) avec son propre message d'erreur.
export function MiniForm({
  action,
  hidden,
  children,
  confirm,
  resetOnSave = false,
  className,
  style,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>
  hidden: Record<string, string>
  children: (args: { pending: boolean; errors: Record<string, string> }) => React.ReactNode
  confirm?: string
  resetOnSave?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const t = useTranslations('forms')
  const { state, pending, onSubmit, formRef } = useEditForm(action, { resetOnSave })
  const form = state.status === 'error' ? state.errors.form : undefined
  return (
    <form
      ref={formRef}
      className={className}
      style={style}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) return e.preventDefault()
        onSubmit(e)
      }}
    >
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children({ pending, errors: state.errors })}
      {form && (
        <p role="alert" className={styles.error} style={{ margin: '8px 0 0' }}>
          {t(`errors.${form}` as never)}
        </p>
      )}
    </form>
  )
}
