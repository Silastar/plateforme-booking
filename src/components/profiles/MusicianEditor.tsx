'use client'

import { useTranslations } from 'next-intl'

import {
  Checkbox,
  Chips,
  formStyles as styles,
  ImageInput,
  Input,
  Section,
  Select,
  TextArea,
} from '@/components/forms/fields'
import { updateMusician } from '@/lib/actions/musician'
import { GENRES } from '@/lib/genres'
import { INSTRUMENTS, LEVELS } from '@/lib/validation'

import { FormStatus, SaveButton, useEditForm } from './SaveBar'

export type MusicianEditValues = {
  stageName: string
  mainInstrument: string
  otherInstruments: string | null
  city: string
  level: string
  styles: string[]
  photo: string | null
  bio: string | null
  videoUrl: string | null
  videoUrl2: string | null
  availableForSubs: boolean
  subInstruments: string | null
  subRadiusKm: number | null
  subNoticeDays: number | null
  repertoireNote: string | null
  gearNote: string | null
}

export function MusicianEditor({ musician: m }: { musician: MusicianEditValues }) {
  const t = useTranslations('editMusician')
  const ta = useTranslations('auth.signup.profile.musicien')
  const tf = useTranslations('forms')
  const tg = useTranslations('genres')
  const { state, pending, onSubmit, formRef } = useEditForm(updateMusician)
  const e = state.errors

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${styles.form} ${styles.accentMusicien}`}>
      <FormStatus state={state} />
      <Section n={1} title={t('infos.title')}>
        <div className={styles.grid}>
          <Input
            name="stageName"
            label={ta('stageName')}
            errors={e}
            defaultValue={m.stageName}
            required
          />
          <Input name="city" label={ta('city')} errors={e} defaultValue={m.city} required />
          <Select
            name="mainInstrument"
            label={ta('instrument')}
            errors={e}
            defaultValue={m.mainInstrument}
            options={INSTRUMENTS.map((i) => ({ value: i, label: ta(`instruments.${i}`) }))}
          />
          <Input
            name="otherInstruments"
            label={ta('other')}
            errors={e}
            defaultValue={m.otherInstruments}
            placeholder={ta('otherPlaceholder')}
          />
          <Select
            name="level"
            label={ta('level')}
            errors={e}
            defaultValue={m.level}
            options={LEVELS.map((l) => ({ value: l, label: ta(`levels.${l}`) }))}
          />
        </div>
        <ImageInput
          name="photo"
          label={t('infos.photo')}
          help={tf('imageHelp')}
          errors={e}
          current={m.photo}
          emptyLabel={tf('noImage')}
        />
        <Chips
          name="styles"
          label={t('infos.styles')}
          help={t('infos.stylesHelp')}
          errors={e}
          options={GENRES.map((g) => ({ value: g, label: tg(g) }))}
          defaultValue={m.styles}
        />
        <TextArea
          name="bio"
          label={t('infos.bio')}
          help={t('infos.bioHelp')}
          errors={e}
          defaultValue={m.bio}
          rows={5}
          maxLength={2000}
        />
      </Section>

      <Section n={2} title={t('videos.title')} intro={t('videos.intro')}>
        <div className={styles.grid}>
          <Input
            name="videoUrl"
            label={t('videos.video1')}
            errors={e}
            defaultValue={m.videoUrl}
            type="url"
            placeholder="https://youtube.com/watch?v=…"
          />
          <Input
            name="videoUrl2"
            label={t('videos.video2')}
            errors={e}
            defaultValue={m.videoUrl2}
            type="url"
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>
      </Section>

      <Section n={3} title={t('subs.title')} intro={t('subs.intro')}>
        <Checkbox name="availableForSubs" label={ta('subs')} defaultChecked={m.availableForSubs} />
        <div className={styles.grid}>
          <Input
            name="subInstruments"
            label={t('subs.instruments')}
            errors={e}
            defaultValue={m.subInstruments}
            placeholder={t('subs.instrumentsPlaceholder')}
          />
          <Input
            name="subRadiusKm"
            label={t('subs.radius')}
            errors={e}
            defaultValue={m.subRadiusKm}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="subNoticeDays"
            label={t('subs.notice')}
            errors={e}
            defaultValue={m.subNoticeDays}
            type="number"
            inputMode="numeric"
          />
        </div>
        <Input
          name="repertoireNote"
          label={t('subs.repertoire')}
          errors={e}
          defaultValue={m.repertoireNote}
          placeholder={t('subs.repertoirePlaceholder')}
        />
        <Input
          name="gearNote"
          label={t('subs.gear')}
          errors={e}
          defaultValue={m.gearNote}
          placeholder={t('subs.gearPlaceholder')}
        />
      </Section>

      <div className={styles.bar}>
        <FormStatus state={state} />
        <SaveButton pending={pending} />
      </div>
    </form>
  )
}
