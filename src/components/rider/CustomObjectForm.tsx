'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useEditForm } from '@/components/profiles/SaveBar'
import type { FormState } from '@/lib/actions/types'
import { MONITORS, STANDS } from '@/lib/rider-catalog'

import { useRiderLabels } from './labels'
import styles from './rider.module.css'

// Création d'un objet perso (nom, entrées, micro, pied, retour), ajouté aussitôt.
export function CustomObjectForm({
  action,
  fields,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>
  fields: Record<string, string>
}) {
  const t = useTranslations('rider')
  const tf = useTranslations('forms')
  const l = useRiderLabels()
  const [open, setOpen] = useState(false)
  const { state, pending, onSubmit, formRef } = useEditForm(action, { resetOnSave: true })
  const err = (k: string) =>
    state.errors[k] ? (
      <span style={{ color: 'var(--c-red-text)', textTransform: 'none', letterSpacing: 0 }}>
        {tf(`errors.${state.errors[k]}` as never)}
      </span>
    ) : null

  if (!open)
    return (
      <>
        <button type="button" className={styles.dashed} onClick={() => setOpen(true)}>
          + {t('catalog.custom')}
        </button>
        <p className={styles.faint} style={{ margin: 0 }}>
          {t('catalog.customHint')}
        </p>
      </>
    )

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: 'var(--c-ink)',
        padding: 14,
      }}
    >
      <strong className={styles.h3}>{t('custom.title')}</strong>
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label className={styles.mini}>
        {t('custom.name')}
        <input name="name" maxLength={60} placeholder={t('custom.namePlaceholder')} required />
        {err('name')}
      </label>
      <label className={styles.mini}>
        {t('custom.inputs')}
        <textarea name="inputs" rows={3} placeholder={t('custom.inputsPlaceholder')} />
        {err('inputs')}
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label className={styles.mini}>
          {t('custom.mic')}
          <input name="mic" maxLength={40} placeholder={t('custom.micPlaceholder')} />
        </label>
        <label className={styles.mini}>
          {t('custom.stand')}
          <select name="stand" defaultValue="none">
            {STANDS.map((s) => (
              <option key={s} value={s}>
                {l.stand(s)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={styles.mini}>
        {t('custom.monitor')}
        <select name="monitor" defaultValue="">
          <option value="">{t('custom.monitorNone')}</option>
          {MONITORS.map((m) => (
            <option key={m} value={m}>
              {l.monitor(m)}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.toolbar}>
        <button type="submit" className={`${styles.small} ${styles.smallOn}`} disabled={pending}>
          {t('custom.create')}
        </button>
        <button type="button" className={styles.small} onClick={() => setOpen(false)}>
          {t('custom.cancel')}
        </button>
      </div>
    </form>
  )
}
