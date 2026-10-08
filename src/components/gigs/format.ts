import { useFormatter, useLocale, useTranslations } from 'next-intl'

// Petits formats communs aux billets et aux listes de dates (francs suisses, heures, dates).
export function useGigFormat() {
  const format = useFormatter()
  const locale = useLocale()
  const t = useTranslations('gigs.ticket')
  const chf = (n: number) =>
    format.number(n, { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })
  return {
    chf,
    budget(min: number | null, max: number | null) {
      if (min === null && max === null) return t('budgetOpen')
      if (min === null || max === null || min === max) return chf((min ?? max)!)
      // « 700–1 100 CHF » / « CHF 700–1,100 »
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'CHF',
        maximumFractionDigits: 0,
      }).formatRange(min, max)
    },
    time: (hhmm: string) =>
      format.dateTime(new Date(`2000-01-01T${hhmm}:00Z`), {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC',
      }),
    day: (
      day: string,
      opts: Pick<Intl.DateTimeFormatOptions, 'weekday' | 'day' | 'month' | 'year'>,
    ) => format.dateTime(new Date(`${day}T12:00:00Z`), { ...opts, timeZone: 'UTC' }),
  }
}
