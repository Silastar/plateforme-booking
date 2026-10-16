'use client'

import { useTranslations } from 'next-intl'

import { FormStatus, useEditForm } from '@/components/profiles/SaveBar'
import { saveRiderInfo } from '@/lib/actions/rider'

import styles from './rider.module.css'

export type RiderInfo = {
  engineer: string | null
  setupMinutes: number | null
  soundcheckMinutes: number | null
  changeoverMinutes: number | null
  minStage: string | null
  people: number | null
  meals: string | null
  greenRoom: string | null
  drinks: string | null
  parking: string | null
  lodging: string | null
}

// Accueil (personnes, repas, loge…) et « en bref » (ingé son, temps, scène).
export function RiderInfoForm({ riderId, info }: { riderId: string; info: RiderInfo }) {
  const t = useTranslations('rider')
  const tf = useTranslations('forms')
  const { state, pending, onSubmit, formRef } = useEditForm(saveRiderInfo)
  const field = (
    name: keyof RiderInfo,
    label: string,
    opts: { placeholder?: string; number?: boolean } = {},
  ) => (
    <label className={styles.mini}>
      {label}
      <input
        name={name}
        type={opts.number ? 'number' : 'text'}
        min={opts.number ? 0 : undefined}
        maxLength={opts.number ? undefined : 160}
        defaultValue={info[name] ?? ''}
        placeholder={opts.placeholder}
        aria-invalid={state.errors[name] ? true : undefined}
      />
      {state.errors[name] && (
        <span style={{ color: 'var(--c-red-text)', textTransform: 'none', letterSpacing: 0 }}>
          {tf(`errors.${state.errors[name]}` as never)}
        </span>
      )}
    </label>
  )

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <input type="hidden" name="riderId" value={riderId} />
      <section className={styles.panel} aria-labelledby="hosp">
        <h2 id="hosp" className={styles.h2}>
          {t('hosp.title')}
        </h2>
        <div className={styles.grid3}>
          {field('people', t('hosp.people'), { number: true })}
          {field('meals', t('hosp.meals'), { placeholder: t('hosp.mealsPlaceholder') })}
          {field('greenRoom', t('hosp.greenRoom'), { placeholder: t('hosp.greenRoomPlaceholder') })}
          {field('drinks', t('hosp.drinks'), { placeholder: t('hosp.drinksPlaceholder') })}
          {field('parking', t('hosp.parking'), { placeholder: t('hosp.parkingPlaceholder') })}
          {field('lodging', t('hosp.lodging'), { placeholder: t('hosp.lodgingPlaceholder') })}
        </div>
      </section>
      <section className={styles.panel} aria-labelledby="general">
        <h2 id="general" className={styles.h2}>
          {t('general.title')}
        </h2>
        <div className={styles.grid3}>
          {field('engineer', t('general.engineer'), {
            placeholder: t('general.engineerPlaceholder'),
          })}
          {field('setupMinutes', t('general.setup'), { number: true })}
          {field('soundcheckMinutes', t('general.soundcheck'), { number: true })}
          {field('changeoverMinutes', t('general.changeover'), { number: true })}
          {field('minStage', t('general.minStage'), {
            placeholder: t('general.minStagePlaceholder'),
          })}
        </div>
      </section>
      <div className={styles.toolbar}>
        <button type="submit" className="btn btn--red" disabled={pending}>
          {t('infoSave')}
        </button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
