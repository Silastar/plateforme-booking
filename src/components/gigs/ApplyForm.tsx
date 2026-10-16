'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { formStyles, Input, Select, TextArea } from '@/components/forms/fields'
import { FormStatus, useEditForm } from '@/components/profiles/SaveBar'
import { applyToGig } from '@/lib/actions/gigs'

import styles from './gigs.module.css'

// Candidature d'un groupe à une date ; le cachet est prérempli avec le bas de sa fourchette.
export function ApplyForm({
  gigId,
  bands,
}: {
  gigId: string
  bands: {
    id: string
    name: string
    feeMin: number | null
    riders: { id: string; name: string }[]
  }[]
}) {
  const t = useTranslations('gigs.apply')
  const tr = useTranslations('rider.apply')
  const [bandId, setBandId] = useState(bands[0].id)
  const riders = bands.find((b) => b.id === bandId)?.riders ?? []
  const { state, pending, onSubmit, formRef } = useEditForm(applyToGig, { resetOnSave: true })
  const errors = state.errors

  return (
    <form ref={formRef} onSubmit={onSubmit} className={styles.panel} noValidate>
      <h2 className={styles.panelTitle}>{t('title')}</h2>
      <input type="hidden" name="gigId" value={gigId} />
      {bands.length > 1 ? (
        <label className={formStyles.field}>
          {t('band')}
          <select name="bandId" value={bandId} onChange={(e) => setBandId(e.target.value)}>
            {bands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="bandId" value={bands[0].id} />
      )}
      {riders.length > 0 && (
        <Select
          key={bandId}
          name="riderId"
          label={tr('rider')}
          errors={errors}
          defaultValue={riders[0].id}
          options={[
            ...riders.map((r) => ({ value: r.id, label: r.name })),
            { value: '', label: tr('riderNone') },
          ]}
        />
      )}
      <Input
        name="fee"
        label={t('fee')}
        help={t('feeHelp')}
        errors={errors}
        type="number"
        inputMode="numeric"
        min={0}
        defaultValue={bands[0].feeMin}
      />
      <TextArea
        name="message"
        label={t('message')}
        placeholder={t('messagePlaceholder')}
        errors={errors}
        maxLength={500}
      />
      {state.status === 'saved' ? (
        <p role="status" className={styles.banner}>
          {t('sent')}
        </p>
      ) : (
        <FormStatus state={state} />
      )}
      <div>
        <button type="submit" className="btn btn--red" disabled={pending}>
          {pending ? t('sending') : t('send')}
        </button>
      </div>
    </form>
  )
}
