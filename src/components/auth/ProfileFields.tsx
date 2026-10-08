'use client'

import { useTranslations } from 'next-intl'

import { GENRES } from '@/lib/genres'
import { INSTRUMENTS, LEVELS, ORG_TYPES, type Role } from '@/lib/validation'

import styles from './auth.module.css'
import { CheckField, SelectField, TextField } from './fields'

export type ProfileValues = Record<string, string | boolean>

export const EMPTY_PROFILE: ProfileValues = {
  name: '',
  type: '',
  city: '',
  capacity: '',
  website: '',
  mainGenre: '',
  musiciansCount: '',
  listenUrl: '',
  stageName: '',
  mainInstrument: '',
  otherInstruments: '',
  level: '',
  availableForSubs: false,
}

// Ne garde que les champs du rôle choisi, au format attendu par la validation.
export function profilePayload(role: Role, v: ProfileValues) {
  const s = (k: string) => String(v[k] ?? '')
  if (role === 'orga') {
    return {
      role,
      name: s('name'),
      type: s('type'),
      city: s('city'),
      capacity: s('capacity'),
      website: s('website'),
    }
  }
  if (role === 'groupe') {
    return {
      role,
      name: s('name'),
      mainGenre: s('mainGenre'),
      city: s('city'),
      musiciansCount: s('musiciansCount'),
      listenUrl: s('listenUrl'),
    }
  }
  return {
    role,
    stageName: s('stageName'),
    mainInstrument: s('mainInstrument'),
    otherInstruments: s('otherInstruments'),
    city: s('city'),
    level: s('level'),
    availableForSubs: Boolean(v.availableForSubs),
  }
}

export function ProfileFields({
  role,
  values,
  onChange,
  errors,
}: {
  role: Role
  values: ProfileValues
  onChange: (key: string, value: string | boolean) => void
  errors: Record<string, string>
}) {
  const t = useTranslations('auth.signup.profile')
  const tg = useTranslations('genres')
  const str = (k: string) => String(values[k] ?? '')
  const err = (k: string) => errors[`profile.${k}`]
  const set = (k: string) => (v: string) => onChange(k, v)

  if (role === 'orga') {
    return (
      <div className={styles.form}>
        <TextField
          label={t('orga.name')}
          placeholder={t('orga.namePlaceholder')}
          value={str('name')}
          onChange={set('name')}
          error={err('name')}
          autoComplete="organization"
        />
        <div className={styles.grid2}>
          <SelectField
            label={t('orga.type')}
            value={str('type')}
            onChange={set('type')}
            error={err('type')}
            placeholder={t('choose')}
            options={ORG_TYPES.map((o) => ({ value: o, label: t(`orga.types.${o}`) }))}
          />
          <TextField
            label={t('orga.city')}
            value={str('city')}
            onChange={set('city')}
            error={err('city')}
            autoComplete="address-level2"
          />
          <TextField
            label={t('orga.capacity')}
            type="number"
            inputMode="numeric"
            min={1}
            value={str('capacity')}
            onChange={set('capacity')}
            error={err('capacity')}
          />
          <TextField
            label={t('orga.website')}
            type="url"
            placeholder={t('orga.websitePlaceholder')}
            value={str('website')}
            onChange={set('website')}
            error={err('website')}
          />
        </div>
      </div>
    )
  }

  if (role === 'groupe') {
    return (
      <div className={styles.form}>
        <TextField
          label={t('groupe.name')}
          placeholder={t('groupe.namePlaceholder')}
          value={str('name')}
          onChange={set('name')}
          error={err('name')}
        />
        <div className={styles.grid2}>
          <SelectField
            label={t('groupe.genre')}
            value={str('mainGenre')}
            onChange={set('mainGenre')}
            error={err('mainGenre')}
            placeholder={t('choose')}
            options={GENRES.map((g) => ({ value: g, label: tg(g) }))}
          />
          <TextField
            label={t('groupe.city')}
            value={str('city')}
            onChange={set('city')}
            error={err('city')}
            autoComplete="address-level2"
          />
          <TextField
            label={t('groupe.musicians')}
            type="number"
            inputMode="numeric"
            min={1}
            value={str('musiciansCount')}
            onChange={set('musiciansCount')}
            error={err('musiciansCount')}
          />
        </div>
        <TextField
          label={t('groupe.listen')}
          type="url"
          placeholder={t('groupe.listenPlaceholder')}
          help={t('groupe.listenHelp')}
          value={str('listenUrl')}
          onChange={set('listenUrl')}
          error={err('listenUrl')}
        />
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <TextField
        label={t('musicien.stageName')}
        placeholder={t('musicien.stageNamePlaceholder')}
        value={str('stageName')}
        onChange={set('stageName')}
        error={err('stageName')}
      />
      <div className={styles.grid2}>
        <SelectField
          label={t('musicien.instrument')}
          value={str('mainInstrument')}
          onChange={set('mainInstrument')}
          error={err('mainInstrument')}
          placeholder={t('choose')}
          options={INSTRUMENTS.map((i) => ({ value: i, label: t(`musicien.instruments.${i}`) }))}
        />
        <TextField
          label={t('musicien.other')}
          placeholder={t('musicien.otherPlaceholder')}
          value={str('otherInstruments')}
          onChange={set('otherInstruments')}
          error={err('otherInstruments')}
        />
        <TextField
          label={t('musicien.city')}
          value={str('city')}
          onChange={set('city')}
          error={err('city')}
          autoComplete="address-level2"
        />
        <SelectField
          label={t('musicien.level')}
          value={str('level')}
          onChange={set('level')}
          error={err('level')}
          placeholder={t('choose')}
          options={LEVELS.map((l) => ({ value: l, label: t(`musicien.levels.${l}`) }))}
        />
      </div>
      <CheckField
        checked={Boolean(values.availableForSubs)}
        onChange={(v) => onChange('availableForSubs', v)}
      >
        {t('musicien.subs')}
      </CheckField>
    </div>
  )
}
