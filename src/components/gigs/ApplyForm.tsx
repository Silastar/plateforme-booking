'use client'

import { useTranslations } from 'next-intl'

import { Input, Select, TextArea } from '@/components/forms/fields'
import { FormStatus, useEditForm } from '@/components/profiles/SaveBar'
import { applyToGig } from '@/lib/actions/gigs'

import styles from './gigs.module.css'

// Candidature d'un groupe à une date ; le cachet est prérempli avec le bas de sa fourchette.
export function ApplyForm({
  gigId,
  bands,
}: {
  gigId: string
  bands: { id: string; name: string; feeMin: number | null }[]
}) {
  const t = useTranslations('gigs.apply')
  const { state, pending, onSubmit, formRef } = useEditForm(applyToGig, { resetOnSave: true })
  const errors = state.errors

  return (
    <form ref={formRef} onSubmit={onSubmit} className={styles.panel} noValidate>
      <h2 className={styles.panelTitle}>{t('title')}</h2>
      <input type="hidden" name="gigId" value={gigId} />
      {bands.length > 1 ? (
        <Select
          name="bandId"
          label={t('band')}
          errors={errors}
          defaultValue={bands[0].id}
          options={bands.map((b) => ({ value: b.id, label: b.name }))}
        />
      ) : (
        <input type="hidden" name="bandId" value={bands[0].id} />
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
