'use client'

import { useTranslations } from 'next-intl'
import { useId } from 'react'

import styles from './auth.module.css'

type Common = { label: string; error?: string; help?: string }

// Message d'erreur traduit à partir du code renvoyé par la validation (« required », « email », …).
export function useErrorText() {
  const t = useTranslations('auth.errors')
  return (code?: string) => (code ? (t.has(code as never) ? t(code as never) : t('invalid')) : '')
}

export function TextField({
  label,
  error,
  help,
  value,
  onChange,
  ...input
}: Common & {
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const id = useId()
  const errorText = useErrorText()
  const describedBy = [help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <label className={styles.field}>
      {label}
      <input
        {...input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {help && (
        <span id={`${id}-help`} className={styles.help}>
          {help}
        </span>
      )}
      {error && (
        <span id={`${id}-error`} className={styles.error}>
          {errorText(error)}
        </span>
      )}
    </label>
  )
}

export function SelectField({
  label,
  error,
  value,
  onChange,
  options,
  placeholder,
}: Common & {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const id = useId()
  const errorText = useErrorText()
  return (
    <label className={styles.field}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${id}-error`} className={styles.error}>
          {errorText(error)}
        </span>
      )}
    </label>
  )
}

export function CheckField({
  children,
  checked,
  onChange,
  error,
}: {
  children: React.ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  error?: string
}) {
  const errorText = useErrorText()
  return (
    <div>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
        />
        <span>{children}</span>
      </label>
      {error && <span className={styles.error}>{errorText(error)}</span>}
    </div>
  )
}
