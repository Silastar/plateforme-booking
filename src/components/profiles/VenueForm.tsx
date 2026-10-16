'use client'

import { useTranslations } from 'next-intl'

import {
  Checkbox,
  formStyles as styles,
  ImageInput,
  Input,
  Section,
} from '@/components/forms/fields'
import type { VenueGear } from '@/db/schema'
import { deleteVenue, saveVenue } from '@/lib/actions/orga'
import { GEAR_COUNTS, GEAR_FLAGS } from '@/lib/profile-edit'

import { FormStatus, SaveButton, useEditForm } from './SaveBar'

export type VenueValues = {
  id: string
  name: string
  address: string | null
  postalCode: string | null
  city: string
  capacity: number | null
  indoor: boolean
  stageSize: string | null
  paProvided: boolean
  lightsProvided: boolean
  engineerOnSite: boolean
  backline: string | null
  greenRoom: boolean
  catering: boolean
  loadIn: string | null
  curfew: string | null
  photo: string | null
  gear: VenueGear
}

// Un lieu existant (modifier / supprimer) ou un nouveau lieu (venue absent).
export function VenueForm({ venue, n }: { venue?: VenueValues; n: number }) {
  const t = useTranslations('venues')
  const tf = useTranslations('forms')
  // Déstructuré : la règle « pas de ref pendant le rendu » refuse l'accès à save.state si save contient la ref.
  const {
    state: saveState,
    pending: savePending,
    onSubmit: saveSubmit,
    formRef: saveRef,
  } = useEditForm(saveVenue, { resetOnSave: !venue })
  const { pending: delPending, onSubmit: delSubmit, formRef: delRef } = useEditForm(deleteVenue)
  const e = saveState.errors
  const v = venue

  return (
    <div className={styles.accentOrga}>
      <form ref={saveRef} onSubmit={saveSubmit} className={styles.form}>
        <input type="hidden" name="venueId" value={v?.id ?? ''} />
        <Section n={n} title={v ? v.name : t('add')}>
          <FormStatus state={saveState} />
          <div className={styles.grid}>
            <Input
              name="name"
              label={t('name')}
              errors={e}
              defaultValue={v?.name}
              placeholder={t('namePlaceholder')}
              required
            />
            <Input
              name="capacity"
              label={t('capacity')}
              errors={e}
              defaultValue={v?.capacity}
              type="number"
              inputMode="numeric"
            />
            <Input
              name="address"
              label={t('address')}
              errors={e}
              defaultValue={v?.address}
              autoComplete="street-address"
            />
            <Input
              name="postalCode"
              label={t('postalCode')}
              errors={e}
              defaultValue={v?.postalCode}
              autoComplete="postal-code"
            />
            <Input
              name="city"
              label={t('city')}
              errors={e}
              defaultValue={v?.city}
              autoComplete="address-level2"
              required
            />
            <Input
              name="stageSize"
              label={t('stageSize')}
              errors={e}
              defaultValue={v?.stageSize}
              placeholder="6 × 4 m"
            />
            <Input
              name="loadIn"
              label={t('loadIn')}
              errors={e}
              defaultValue={v?.loadIn}
              placeholder="17:00"
            />
            <Input
              name="curfew"
              label={t('curfew')}
              errors={e}
              defaultValue={v?.curfew}
              placeholder="01:00"
            />
          </div>
          <Input
            name="backline"
            label={t('backline')}
            errors={e}
            defaultValue={v?.backline}
            placeholder={t('backlinePlaceholder')}
          />
          <div className={styles.grid}>
            <Checkbox name="indoor" label={t('indoor')} defaultChecked={v?.indoor ?? true} />
            <Checkbox name="paProvided" label={t('pa')} defaultChecked={v?.paProvided} />
            <Checkbox
              name="lightsProvided"
              label={t('lights')}
              defaultChecked={v?.lightsProvided}
            />
            <Checkbox
              name="engineerOnSite"
              label={t('engineer')}
              defaultChecked={v?.engineerOnSite}
            />
            <Checkbox name="greenRoom" label={t('greenRoom')} defaultChecked={v?.greenRoom} />
            <Checkbox name="catering" label={t('catering')} defaultChecked={v?.catering} />
          </div>
          <VenueGearFields gear={v?.gear ?? {}} />
          <ImageInput
            name="photo"
            label={t('photo')}
            help={tf('imageHelp')}
            errors={e}
            current={v?.photo}
            emptyLabel={tf('noImage')}
          />
          <div className={styles.bar}>
            <span />
            <SaveButton pending={savePending} />
          </div>
        </Section>
      </form>
      {v && (
        <form
          ref={delRef}
          onSubmit={(ev) => {
            if (!window.confirm(t('confirmDelete', { name: v.name }))) return ev.preventDefault()
            delSubmit(ev)
          }}
          style={{ marginTop: 8, textAlign: 'right' }}
        >
          <input type="hidden" name="venueId" value={v.id} />
          <button type="submit" className="btn btn--ghost" disabled={delPending}>
            {t('delete')}
          </button>
        </form>
      )}
    </div>
  )
}

// Matériel détaillé, comparé aux fiches techniques des groupes. Vide = pas renseigné.
function VenueGearFields({ gear }: { gear: VenueGear }) {
  const t = useTranslations('editOrga.gear')
  const tv = useTranslations('venues')
  const g = gear as Record<string, number | boolean | string | undefined>
  return (
    <fieldset className={styles.section} style={{ background: 'var(--c-ink)', borderTopWidth: 3 }}>
      <legend className={styles.legend} style={{ fontSize: 22 }}>
        {t('title')}
      </legend>
      <p className={styles.sectionIntro}>{t('intro')}</p>
      <div className={styles.grid}>
        {GEAR_COUNTS.map((k) => (
          <label key={k} className={styles.field}>
            {t(k)}
            <input
              type="number"
              name={`gear_${k}`}
              min={0}
              max={999}
              defaultValue={typeof g[k] === 'number' ? (g[k] as number) : ''}
            />
          </label>
        ))}
      </div>
      <div className={styles.grid}>
        {GEAR_FLAGS.map((k) => (
          <label key={k} className={styles.field}>
            {t(k)}
            <select
              name={`gear_${k}`}
              defaultValue={g[k] === true ? 'yes' : g[k] === false ? 'no' : ''}
            >
              <option value="">—</option>
              <option value="yes">{tv('yes')}</option>
              <option value="no">{tv('no')}</option>
            </select>
          </label>
        ))}
      </div>
      <label className={styles.field}>
        {t('micList')}
        <input
          name="gear_micList"
          maxLength={300}
          defaultValue={typeof g.micList === 'string' ? g.micList : ''}
          placeholder={t('micListPlaceholder')}
        />
      </label>
    </fieldset>
  )
}
