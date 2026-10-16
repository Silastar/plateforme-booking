'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { ActionButton } from '@/components/gigs/ActionButton'
import { FormStatus, useEditForm } from '@/components/profiles/SaveBar'
import { createRider, deleteRider, renameRider } from '@/lib/actions/rider'

import styles from './rider.module.css'

// Nouvelle configuration (vide, pré-remplie selon les instruments, ou copie d'une autre).
export function NewConfigForm({
  bandId,
  riders,
  first = false,
}: {
  bandId: string
  riders: { id: string; name: string }[]
  first?: boolean
}) {
  const t = useTranslations('rider')
  const [open, setOpen] = useState(first)
  const { state, pending, onSubmit, formRef } = useEditForm(createRider)
  if (!open)
    return (
      <button type="button" className={styles.dashed} onClick={() => setOpen(true)}>
        + {t('configs.new')}
      </button>
    )
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={styles.panel}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 12 }}
    >
      <input type="hidden" name="bandId" value={bandId} />
      <label className={styles.mini} style={{ flex: '1 1 220px' }}>
        {t('configs.name')}
        <input
          name="name"
          maxLength={60}
          required
          defaultValue={first ? t('configs.defaultName') : ''}
          placeholder={t('configs.namePlaceholder')}
        />
      </label>
      <label className={styles.mini} style={{ flex: '1 1 220px' }}>
        {t('configs.duplicate')}
        <select name="from" defaultValue={riders.length ? riders[0].id : 'prefill'}>
          <option value="prefill">{t('empty.prefill')}</option>
          <option value="">{t('configs.blank')}</option>
          {riders.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn btn--red" disabled={pending}>
        {first ? t('empty.create') : t('configs.create')}
      </button>
      <FormStatus state={state} />
    </form>
  )
}

export function ConfigActions({ riderId, name }: { riderId: string; name: string }) {
  const t = useTranslations('rider.configs')
  const [open, setOpen] = useState(false)
  const { state, pending, onSubmit, formRef } = useEditForm(renameRider)
  return (
    <div className={styles.toolbar}>
      {open ? (
        <form ref={formRef} onSubmit={onSubmit} className={styles.toolbar}>
          <input type="hidden" name="riderId" value={riderId} />
          <label className={styles.mini}>
            <span style={{ position: 'absolute', left: -9999 }}>{t('name')}</span>
            <input name="name" defaultValue={name} maxLength={60} required />
          </label>
          <button type="submit" className={`${styles.small} ${styles.smallOn}`} disabled={pending}>
            OK
          </button>
          <FormStatus state={state} />
        </form>
      ) : (
        <button type="button" className={styles.small} onClick={() => setOpen(true)}>
          {t('rename')}
        </button>
      )}
      <ActionButton
        action={deleteRider}
        fields={{ riderId }}
        label={t('delete')}
        confirm={t('deleteConfirm')}
        className={styles.small}
      />
    </div>
  )
}
