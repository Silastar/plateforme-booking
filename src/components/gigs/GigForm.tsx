'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
  Chips,
  formStyles as fs,
  Input,
  Section,
  Select,
  TextArea,
} from '@/components/forms/fields'
import { FormStatus, useEditForm } from '@/components/profiles/SaveBar'
import { Link } from '@/i18n/navigation'
import { saveGig } from '@/lib/actions/gigs'
import { GENRES } from '@/lib/genres'
import { GIG_FORMATS, GIG_INCLUDES, MAX_REPEAT, REPEAT_MODES, SET_LENGTHS } from '@/lib/gig-rules'

import styles from './gigs.module.css'
import { GigTicket, type TicketData } from './GigTicket'

type Venue = { id: string; name: string; city: string; capacity: number | null; gear: string[] }
export type GigValues = {
  id: string
  venueId: string | null
  day: string
  loadIn: string | null
  setStart: string | null
  curfew: string | null
  genres: string[]
  format: string
  bandsCount: number
  setLength: number | null
  budgetMin: number | null
  budgetMax: number | null
  includes: string[]
  visibility: string
  note: string | null
}

const int = (v: FormDataEntryValue | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : null)

// Formulaire en 4 blocs (quand et où, ce que tu cherches, conditions, qui la voit),
// avec l'aperçu du billet tel que les groupes le verront, mis à jour à chaque saisie.
export function GigForm({
  orga,
  venues,
  gig,
  today,
}: {
  orga: { name: string; city: string; capacity: number | null }
  venues: Venue[]
  gig?: GigValues
  today: string
}) {
  const t = useTranslations('gigs.form')
  const tf = useTranslations('gigs.format')
  const ti = useTranslations('gigs.includes')
  const tg = useTranslations('genres')
  const { state, pending, onSubmit, formRef } = useEditForm(saveGig)
  const e = state.errors

  const initial = {
    venueId: gig?.venueId ?? venues[0]?.id ?? '',
    day: gig?.day ?? '',
    loadIn: gig?.loadIn ?? '',
    setStart: gig?.setStart ?? '',
    curfew: gig?.curfew ?? '',
    genres: gig?.genres ?? [],
    format: gig?.format ?? 'headline',
    bandsCount: gig?.bandsCount ?? 2,
    setLength: gig?.setLength ?? null,
    budgetMin: gig?.budgetMin ?? null,
    budgetMax: gig?.budgetMax ?? null,
    includes: gig?.includes ?? [],
    visibility: gig?.visibility ?? 'open',
  }
  const [preview, setPreview] = useState(initial)
  const [repeat, setRepeat] = useState('none')

  function readPreview(form: HTMLFormElement) {
    const fd = new FormData(form)
    setRepeat(String(fd.get('repeat') ?? 'none'))
    setPreview({
      venueId: String(fd.get('venueId') ?? ''),
      day: String(fd.get('day') ?? ''),
      loadIn: String(fd.get('loadIn') ?? ''),
      setStart: String(fd.get('setStart') ?? ''),
      curfew: String(fd.get('curfew') ?? ''),
      genres: fd.getAll('genres').map(String),
      format: String(fd.get('format') ?? 'headline'),
      bandsCount: int(fd.get('bandsCount')) ?? 2,
      setLength: int(fd.get('setLength')),
      budgetMin: int(fd.get('budgetMin')),
      budgetMax: int(fd.get('budgetMax')),
      includes: fd.getAll('includes').map(String),
      visibility: String(fd.get('visibility') ?? 'open'),
    })
  }

  const venue = venues.find((v) => v.id === preview.venueId) ?? null
  const ticket: TicketData = {
    id: gig?.id ?? 'preview',
    day: /^\d{4}-\d{2}-\d{2}$/.test(preview.day) ? preview.day : today,
    genres: preview.genres,
    format: preview.format,
    bandsCount: preview.format === 'bill' ? preview.bandsCount : 1,
    setLength: preview.setLength,
    budgetMin: preview.budgetMin,
    budgetMax: preview.budgetMax,
    includes: preview.includes,
    loadIn: preview.loadIn || null,
    setStart: preview.setStart || null,
    curfew: preview.curfew || null,
    orgaName: orga.name,
    venueName: venue?.name ?? null,
    city: venue?.city ?? orga.city,
    capacity: venue?.capacity ?? orga.capacity,
  }

  return (
    <div className={styles.formLayout}>
      <form
        ref={formRef}
        onSubmit={onSubmit}
        onInput={(ev) => readPreview(ev.currentTarget)}
        onChange={(ev) => readPreview(ev.currentTarget)}
        className={`${fs.form} ${fs.accentOrga}`}
        noValidate
      >
        {gig && <input type="hidden" name="gigId" value={gig.id} />}
        <FormStatus state={state} />

        <Section n={1} title={t('when.title')}>
          <Select
            name="venueId"
            label={t('when.venue')}
            help={venues.length === 0 ? t('when.venueHelp') : undefined}
            errors={e}
            defaultValue={initial.venueId}
            options={
              venues.length
                ? venues.map((v) => ({
                    value: v.id,
                    label: v.capacity ? `${v.name} · ${v.capacity}` : v.name,
                  }))
                : [{ value: '', label: t('when.venueNone', { name: orga.name, city: orga.city }) }]
            }
          />
          <div className={fs.grid}>
            <Input
              name="day"
              label={t('when.day')}
              type="date"
              min={today}
              errors={e}
              defaultValue={initial.day}
              required
            />
            <Input
              name="loadIn"
              label={t('when.loadIn')}
              type="time"
              errors={e}
              defaultValue={initial.loadIn}
            />
            <Input
              name="setStart"
              label={t('when.setStart')}
              type="time"
              errors={e}
              defaultValue={initial.setStart}
            />
            <Input
              name="curfew"
              label={t('when.curfew')}
              type="time"
              errors={e}
              defaultValue={initial.curfew}
            />
          </div>
          {!gig && (
            <div className={fs.grid}>
              <Select
                name="repeat"
                label={t('when.repeat')}
                errors={e}
                defaultValue="none"
                options={REPEAT_MODES.map((m) => ({ value: m, label: t(`when.repeatModes.${m}`) }))}
              />
              {repeat !== 'none' && (
                <Input
                  name="repeatCount"
                  label={t('when.repeatCount')}
                  help={t('when.repeatHelp')}
                  type="number"
                  min={2}
                  max={MAX_REPEAT}
                  errors={e}
                  defaultValue={4}
                />
              )}
            </div>
          )}
        </Section>

        <Section n={2} title={t('what.title')}>
          <Chips
            name="genres"
            label={t('what.genres')}
            help={t('what.genresHelp')}
            errors={e}
            options={GENRES.map((g) => ({ value: g, label: tg(g) }))}
            defaultValue={initial.genres}
          />
          <fieldset className={fs.field} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ padding: 0, marginBottom: 8 }}>{t('what.format')}</legend>
            <div className={styles.radioCards}>
              {GIG_FORMATS.map((f) => (
                <label key={f} className={styles.radioCard}>
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    defaultChecked={initial.format === f}
                  />
                  <strong>{tf(f)}</strong>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={fs.grid}>
            {preview.format === 'bill' && (
              <Input
                name="bandsCount"
                label={t('what.bandsCount')}
                type="number"
                min={2}
                max={10}
                errors={e}
                defaultValue={initial.bandsCount}
              />
            )}
            <Select
              name="setLength"
              label={t('what.setLength')}
              errors={e}
              defaultValue={initial.setLength ? String(initial.setLength) : ''}
              placeholder={t('what.setLengthNone')}
              options={SET_LENGTHS.map((n) => ({ value: String(n), label: `${n} min` }))}
            />
          </div>
        </Section>

        <Section n={3} title={t('terms.title')}>
          <div className={fs.grid}>
            <Input
              name="budgetMin"
              label={t('terms.budgetMin')}
              type="number"
              inputMode="numeric"
              min={0}
              errors={e}
              defaultValue={initial.budgetMin}
            />
            <Input
              name="budgetMax"
              label={t('terms.budgetMax')}
              type="number"
              inputMode="numeric"
              min={0}
              errors={e}
              defaultValue={initial.budgetMax}
            />
          </div>
          <Chips
            name="includes"
            label={t('terms.includes')}
            errors={e}
            options={GIG_INCLUDES.map((x) => ({ value: x, label: ti(x) }))}
            defaultValue={initial.includes}
          />
          <p className={fs.sectionIntro}>
            {venue && venue.gear.length
              ? t('terms.gear', { list: venue.gear.join(', ') })
              : t('terms.gearNone')}{' '}
            <Link href="/compte/orga" style={{ color: 'var(--c-amber)' }}>
              {t('terms.editVenue')}
            </Link>
          </p>
        </Section>

        <Section n={4} title={t('who.title')}>
          <div className={styles.radioCards}>
            {(['open', 'invite'] as const).map((x) => (
              <label key={x} className={styles.radioCard}>
                <input
                  type="radio"
                  name="visibility"
                  value={x}
                  defaultChecked={initial.visibility === x}
                />
                <span>
                  <strong>{t(`who.${x}`)}</strong>
                  {t(`who.${x}Text`)}
                </span>
              </label>
            ))}
          </div>
          <TextArea
            name="note"
            label={t('who.note')}
            errors={e}
            maxLength={600}
            rows={3}
            defaultValue={gig?.note}
          />
        </Section>

        <div className={fs.bar}>
          <Link href="/compte/dates" className="btn btn--ghost">
            {t('back')}
          </Link>
          <button type="submit" className={`btn ${fs.save}`} disabled={pending}>
            {pending ? t('publishing') : gig ? t('save') : t('publish')}
          </button>
        </div>
        {state.status === 'error' && <FormStatus state={state} />}
      </form>

      <aside className={styles.previewCol} aria-label={t('preview')}>
        <span className="label" style={{ color: 'var(--c-faint)' }}>
          {t('preview')}
        </span>
        <GigTicket gig={ticket} unlocked link="preview" />
      </aside>
    </div>
  )
}
