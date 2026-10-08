'use client'

import { useTranslations } from 'next-intl'

import {
  Chips,
  formStyles as styles,
  ImageInput,
  Input,
  Section,
  Select,
  TextArea,
} from '@/components/forms/fields'
import { updateOrga } from '@/lib/actions/orga'
import { GENRES } from '@/lib/genres'
import { ORG_TYPES } from '@/lib/validation'

import { FormStatus, SaveButton, useEditForm } from './SaveBar'

export type OrgaEditValues = {
  name: string
  type: string
  city: string
  since: number | null
  website: string | null
  description: string | null
  logo: string | null
  cover: string | null
  genres: string[]
  eventTypes: string | null
  bandsPerNight: string | null
  setLength: string | null
  rhythm: string | null
  budgetMin: number | null
  budgetMax: number | null
  feeTerms: string | null
}

export function OrgaEditor({ orga }: { orga: OrgaEditValues }) {
  const t = useTranslations('editOrga')
  const ta = useTranslations('auth.signup.profile.orga')
  const tf = useTranslations('forms')
  const tg = useTranslations('genres')
  const { state, pending, onSubmit, formRef } = useEditForm(updateOrga)
  const e = state.errors

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${styles.form} ${styles.accentOrga}`}>
      <FormStatus state={state} />
      <Section n={1} title={t('structure.title')}>
        <div className={styles.grid}>
          <Input
            name="name"
            label={t('structure.name')}
            errors={e}
            defaultValue={orga.name}
            required
          />
          <Select
            name="type"
            label={t('structure.type')}
            errors={e}
            defaultValue={orga.type}
            options={ORG_TYPES.map((o) => ({ value: o, label: ta(`types.${o}`) }))}
          />
          <Input
            name="city"
            label={t('structure.city')}
            errors={e}
            defaultValue={orga.city}
            required
          />
          <Input
            name="since"
            label={t('structure.since')}
            errors={e}
            defaultValue={orga.since}
            type="number"
            inputMode="numeric"
          />
        </div>
        <Input
          name="website"
          label={t('structure.website')}
          errors={e}
          defaultValue={orga.website}
          type="url"
          placeholder="https://"
        />
        <TextArea
          name="description"
          label={t('structure.description')}
          help={t('structure.descriptionHelp')}
          errors={e}
          defaultValue={orga.description}
          rows={5}
          maxLength={1500}
        />
        <div className={styles.grid}>
          <ImageInput
            name="logo"
            label={t('structure.logo')}
            help={tf('imageHelp')}
            errors={e}
            current={orga.logo}
            emptyLabel={tf('noImage')}
          />
          <ImageInput
            name="cover"
            label={t('structure.cover')}
            help={t('structure.coverHelp')}
            errors={e}
            current={orga.cover}
            emptyLabel={tf('noImage')}
          />
        </div>
      </Section>

      <Section n={2} title={t('program.title')}>
        <Chips
          name="genres"
          label={t('program.genres')}
          help={t('program.genresHelp')}
          errors={e}
          options={GENRES.map((g) => ({ value: g, label: tg(g) }))}
          defaultValue={orga.genres}
        />
        <div className={styles.grid}>
          <Input
            name="eventTypes"
            label={t('program.eventTypes')}
            errors={e}
            defaultValue={orga.eventTypes}
            placeholder={t('program.eventTypesPlaceholder')}
          />
          <Input
            name="bandsPerNight"
            label={t('program.bandsPerNight')}
            errors={e}
            defaultValue={orga.bandsPerNight}
            placeholder={t('program.bandsPerNightPlaceholder')}
          />
          <Input
            name="setLength"
            label={t('program.setLength')}
            errors={e}
            defaultValue={orga.setLength}
            placeholder={t('program.setLengthPlaceholder')}
          />
          <Input
            name="rhythm"
            label={t('program.rhythm')}
            errors={e}
            defaultValue={orga.rhythm}
            placeholder={t('program.rhythmPlaceholder')}
          />
        </div>
      </Section>

      <Section n={3} title={t('terms.title')} intro={t('terms.intro')}>
        <div className={styles.grid}>
          <Input
            name="budgetMin"
            label={t('terms.budgetMin')}
            errors={e}
            defaultValue={orga.budgetMin}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="budgetMax"
            label={t('terms.budgetMax')}
            errors={e}
            defaultValue={orga.budgetMax}
            type="number"
            inputMode="numeric"
          />
        </div>
        <Input
          name="feeTerms"
          label={t('terms.feeTerms')}
          errors={e}
          defaultValue={orga.feeTerms}
          placeholder={t('terms.feeTermsPlaceholder')}
        />
      </Section>

      <div className={styles.bar}>
        <FormStatus state={state} />
        <SaveButton pending={pending} />
      </div>
    </form>
  )
}
