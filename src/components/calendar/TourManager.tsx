'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { formStyles as styles, Input, Section } from '@/components/forms/fields'
import { MiniForm } from '@/components/profiles/MiniForm'
import css from '@/components/profiles/profile.module.css'
import { addTour, deleteTour } from '@/lib/actions/calendar'

type TourView = { id: string; startDate: string; endDate: string; region: string }

export function TourManager({ bandId, tours }: { bandId: string; tours: TourView[] }) {
  const t = useTranslations('calendar.tours')
  const format = useFormatter()
  const d = (day: string) =>
    format.dateTime(new Date(`${day}T12:00:00Z`), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
  return (
    <div className={`${styles.form} ${styles.accentGroupe}`}>
      <Section title={t('title')} intro={t('intro')}>
        {tours.map((tour) => (
          <div key={tour.id} className={css.facade}>
            <span>
              <strong>{t('range', { from: d(tour.startDate), to: d(tour.endDate) })}</strong> ·{' '}
              {tour.region}
            </span>
            <MiniForm action={deleteTour} hidden={{ bandId, tourId: tour.id }}>
              {({ pending }) => (
                <button type="submit" className="btn btn--ghost" disabled={pending}>
                  {t('delete')}
                </button>
              )}
            </MiniForm>
          </div>
        ))}
        <MiniForm
          action={addTour}
          hidden={{ bandId }}
          resetOnSave
          className={styles.form}
          style={{ gap: 12 }}
        >
          {({ pending, errors }) => (
            <>
              <div className={styles.grid}>
                <Input name="startDate" type="date" label={t('from')} errors={errors} required />
                <Input name="endDate" type="date" label={t('to')} errors={errors} required />
                <Input
                  name="region"
                  label={t('region')}
                  errors={errors}
                  placeholder={t('regionPlaceholder')}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn--red"
                disabled={pending}
                style={{ alignSelf: 'flex-start' }}
              >
                {t('add')}
              </button>
            </>
          )}
        </MiniForm>
      </Section>
    </div>
  )
}
