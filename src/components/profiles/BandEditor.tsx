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
import { updateBand } from '@/lib/actions/band'
import { GENRES } from '@/lib/genres'

import { FormStatus, SaveButton, useEditForm } from './SaveBar'

export type BandEditValues = {
  id: string
  name: string
  city: string
  since: number | null
  musiciansCount: number | null
  mainGenre: string
  genres: string[]
  repertoire: string | null
  setMin: number | null
  setMax: number | null
  listenUrl: string
  photo: string | null
  bio: string | null
  story: string | null
  discography: string | null
  press: string | null
  spotifyUrl: string | null
  bandcampUrl: string | null
  soundcloudUrl: string | null
  youtubeUrl: string | null
  rider: string | null
  lineupDetail: string | null
  backline: string | null
  ownEngineer: boolean
  setupMinutes: number | null
  minStage: string | null
  radiusKm: number | null
  regions: string | null
  feeMin: number | null
  feeMax: number | null
  feeNote: string | null
}

export function BandEditor({ band }: { band: BandEditValues }) {
  const t = useTranslations('editBand')
  const tf = useTranslations('forms')
  const tg = useTranslations('genres')
  const { state, pending, onSubmit, formRef } = useEditForm(updateBand)
  const e = state.errors
  const genreOptions = GENRES.map((g) => ({ value: g, label: tg(g) }))

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${styles.form} ${styles.accentGroupe}`}>
      <input type="hidden" name="bandId" value={band.id} />
      <FormStatus state={state} />

      <Section n={1} title={t('infos.title')}>
        <div className={styles.grid}>
          <Input name="name" label={t('infos.name')} errors={e} defaultValue={band.name} required />
          <Input name="city" label={t('infos.city')} errors={e} defaultValue={band.city} required />
          <Input
            name="since"
            label={t('infos.since')}
            errors={e}
            defaultValue={band.since}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="musiciansCount"
            label={t('infos.musicians')}
            errors={e}
            defaultValue={band.musiciansCount}
            type="number"
            inputMode="numeric"
          />
        </div>
        <ImageInput
          name="photo"
          label={t('infos.photo')}
          help={tf('imageHelp')}
          errors={e}
          current={band.photo}
          emptyLabel={tf('noImage')}
        />
        <div className={styles.grid}>
          <Select
            name="mainGenre"
            label={t('infos.mainGenre')}
            errors={e}
            defaultValue={band.mainGenre}
            options={genreOptions}
          />
          <Select
            name="repertoire"
            label={t('infos.repertoire')}
            errors={e}
            defaultValue={band.repertoire}
            placeholder={tf('choose')}
            options={(['compos', 'reprises', 'mixte'] as const).map((r) => ({
              value: r,
              label: t(`infos.repertoires.${r}`),
            }))}
          />
          <Input
            name="setMin"
            label={t('infos.setMin')}
            errors={e}
            defaultValue={band.setMin}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="setMax"
            label={t('infos.setMax')}
            errors={e}
            defaultValue={band.setMax}
            type="number"
            inputMode="numeric"
          />
        </div>
        <Chips
          name="genres"
          label={t('infos.genres')}
          help={t('infos.genresHelp')}
          errors={e}
          options={genreOptions}
          defaultValue={band.genres}
        />
        <Input
          name="listenUrl"
          label={t('infos.listenUrl')}
          help={t('infos.listenHelp')}
          errors={e}
          defaultValue={band.listenUrl}
          type="url"
          required
        />
      </Section>

      <Section n={2} title={t('bio.title')}>
        <TextArea
          name="bio"
          label={t('bio.short')}
          help={t('bio.shortHelp')}
          errors={e}
          defaultValue={band.bio}
          rows={3}
          maxLength={400}
        />
        <TextArea
          name="story"
          label={t('bio.long')}
          errors={e}
          defaultValue={band.story}
          rows={7}
          maxLength={4000}
        />
        <div className={styles.grid}>
          <TextArea
            name="discography"
            label={t('bio.discography')}
            errors={e}
            defaultValue={band.discography}
            rows={3}
          />
          <TextArea
            name="press"
            label={t('bio.press')}
            errors={e}
            defaultValue={band.press}
            rows={3}
          />
        </div>
      </Section>

      <Section n={3} title={t('media.title')} intro={t('media.intro')}>
        <div className={styles.grid}>
          <Input
            name="spotifyUrl"
            label="Spotify"
            errors={e}
            defaultValue={band.spotifyUrl}
            type="url"
            placeholder="https://open.spotify.com/…"
          />
          <Input
            name="bandcampUrl"
            label="Bandcamp"
            errors={e}
            defaultValue={band.bandcampUrl}
            type="url"
            placeholder="https://….bandcamp.com"
          />
          <Input
            name="soundcloudUrl"
            label="SoundCloud"
            errors={e}
            defaultValue={band.soundcloudUrl}
            type="url"
            placeholder="https://soundcloud.com/…"
          />
          <Input
            name="youtubeUrl"
            label={t('media.youtube')}
            errors={e}
            defaultValue={band.youtubeUrl}
            type="url"
            placeholder="https://youtube.com/watch?v=…"
          />
        </div>
      </Section>

      <Section n={4} title={t('tech.title')} intro={t('tech.intro')}>
        <div className={styles.field}>
          <span>{t('tech.rider')}</span>
          {band.rider && (
            <span className={styles.help}>
              <a href={band.rider} target="_blank" rel="noopener">
                {t('tech.currentRider')}
              </a>
            </span>
          )}
          <input
            type="file"
            name="rider"
            accept="application/pdf"
            className={styles.file}
            aria-label={t('tech.rider')}
          />
          {e.rider && <span className={styles.error}>{tf(`errors.${e.rider}` as never)}</span>}
          {band.rider && <Checkbox name="removeRider" label={t('tech.removeRider')} />}
        </div>
        <div className={styles.grid}>
          <Input
            name="lineupDetail"
            label={t('tech.lineup')}
            errors={e}
            defaultValue={band.lineupDetail}
            placeholder={t('tech.lineupPlaceholder')}
          />
          <Input
            name="backline"
            label={t('tech.backline')}
            errors={e}
            defaultValue={band.backline}
            placeholder={t('tech.backlinePlaceholder')}
          />
          <Input
            name="setupMinutes"
            label={t('tech.setup')}
            errors={e}
            defaultValue={band.setupMinutes}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="minStage"
            label={t('tech.minStage')}
            errors={e}
            defaultValue={band.minStage}
            placeholder="5 × 3 m"
          />
        </div>
        <Checkbox
          name="ownEngineer"
          label={t('tech.ownEngineer')}
          defaultChecked={band.ownEngineer}
        />
      </Section>

      <Section n={5} title={t('zone.title')} intro={t('zone.intro')}>
        <div className={styles.grid}>
          <Input
            name="radiusKm"
            label={t('zone.radius')}
            errors={e}
            defaultValue={band.radiusKm}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="regions"
            label={t('zone.regions')}
            errors={e}
            defaultValue={band.regions}
            placeholder={t('zone.regionsPlaceholder')}
          />
          <Input
            name="feeMin"
            label={t('zone.feeMin')}
            errors={e}
            defaultValue={band.feeMin}
            type="number"
            inputMode="numeric"
          />
          <Input
            name="feeMax"
            label={t('zone.feeMax')}
            errors={e}
            defaultValue={band.feeMax}
            type="number"
            inputMode="numeric"
          />
        </div>
        <Input
          name="feeNote"
          label={t('zone.feeNote')}
          errors={e}
          defaultValue={band.feeNote}
          placeholder={t('zone.feeNotePlaceholder')}
        />
      </Section>

      <div className={styles.bar}>
        <FormStatus state={state} />
        <SaveButton pending={pending} />
      </div>
    </form>
  )
}
