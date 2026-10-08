'use client'

import { useTranslations } from 'next-intl'
import { useId } from 'react'

import styles from './forms.module.css'

export type Errors = Record<string, string>

function useErr() {
  const t = useTranslations('forms.errors')
  return (code?: string) => (code ? (t.has(code as never) ? t(code as never) : t('invalid')) : '')
}

function Describe({ id, help, error }: { id: string; help?: string; error?: string }) {
  const err = useErr()
  return (
    <>
      {help && (
        <span id={`${id}-h`} className={styles.help}>
          {help}
        </span>
      )}
      {error && (
        <span id={`${id}-e`} className={styles.error}>
          {err(error)}
        </span>
      )}
    </>
  )
}

const described = (id: string, help?: string, error?: string) =>
  [help && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined

type Base = { name: string; label: string; help?: string; errors: Errors }

export function Input({
  name,
  label,
  help,
  errors,
  defaultValue,
  ...rest
}: Base & { defaultValue?: string | number | null } & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'name' | 'defaultValue'
  >) {
  const id = useId()
  return (
    <label className={styles.field}>
      {label}
      <input
        {...rest}
        name={name}
        defaultValue={defaultValue ?? ''}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={described(id, help, errors[name])}
      />
      <Describe id={id} help={help} error={errors[name]} />
    </label>
  )
}

export function TextArea({
  name,
  label,
  help,
  errors,
  defaultValue,
  rows = 4,
  maxLength,
  placeholder,
}: Base & {
  defaultValue?: string | null
  rows?: number
  maxLength?: number
  placeholder?: string
}) {
  const id = useId()
  return (
    <label className={styles.field}>
      {label}
      <textarea
        name={name}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ''}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={described(id, help, errors[name])}
      />
      <Describe id={id} help={help} error={errors[name]} />
    </label>
  )
}

export function Select({
  name,
  label,
  help,
  errors,
  defaultValue,
  options,
  placeholder,
}: Base & {
  defaultValue?: string | null
  options: { value: string; label: string }[]
  placeholder?: string
}) {
  const id = useId()
  return (
    <label className={styles.field}>
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ''}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={described(id, help, errors[name])}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Describe id={id} help={help} error={errors[name]} />
    </label>
  )
}

export function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className={styles.check}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  )
}

export function Chips({
  name,
  label,
  help,
  errors,
  options,
  defaultValue,
}: Base & { options: { value: string; label: string }[]; defaultValue: string[] }) {
  const id = useId()
  return (
    <fieldset className={styles.field} style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ padding: 0, marginBottom: 8 }}>{label}</legend>
      <div className={styles.chips} aria-describedby={described(id, help, errors[name])}>
        {options.map((o) => (
          <label key={o.value} className={styles.chip}>
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={defaultValue.includes(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
      <Describe id={id} help={help} error={errors[name]} />
    </fieldset>
  )
}

export function ImageInput({
  name,
  label,
  help,
  errors,
  current,
  emptyLabel,
}: Base & { current?: string | null; emptyLabel: string }) {
  const id = useId()
  return (
    <div className={styles.field}>
      <span>{label}</span>
      <div className={styles.media}>
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="" className={styles.thumb} />
        ) : (
          <span className={styles.thumbEmpty}>{emptyLabel}</span>
        )}
        <input
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className={styles.file}
          aria-label={label}
          aria-describedby={described(id, help, errors[name])}
        />
      </div>
      <Describe id={id} help={help} error={errors[name]} />
    </div>
  )
}

export function Section({
  n,
  title,
  intro,
  children,
}: {
  n?: number
  title: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className={styles.section}>
      <legend className={styles.legend}>
        {n !== undefined && (
          <span className={styles.legendNumber}>{String(n).padStart(2, '0')}</span>
        )}
        {title}
      </legend>
      {intro && <p className={styles.sectionIntro}>{intro}</p>}
      {children}
    </fieldset>
  )
}

export { styles as formStyles }
