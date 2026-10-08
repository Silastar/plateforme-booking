import { getFormatter, getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import { monthKey, shiftMonth } from '@/lib/calendar'

import styles from './calendar.module.css'

type Href = React.ComponentProps<typeof Link>['href']

// En-tête « ← Mars 2027 → » ; makeHref construit le lien vers un autre mois (?mois=2027-04).
export async function MonthNav({
  year,
  month,
  makeHref,
}: {
  year: number
  month: number
  makeHref: (mois: string) => Href
}) {
  const t = await getTranslations('calendar')
  const format = await getFormatter()
  const prev = shiftMonth(year, month, -1)
  const next = shiftMonth(year, month, 1)
  const title = format.dateTime(new Date(Date.UTC(year, month - 1, 15)), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <div className={styles.head}>
      <Link
        href={makeHref(monthKey(prev.year, prev.month))}
        className={styles.nav}
        aria-label={t('prev')}
      >
        ←
      </Link>
      <h2 className={styles.month}>{title}</h2>
      <Link
        href={makeHref(monthKey(next.year, next.month))}
        className={styles.nav}
        aria-label={t('next')}
      >
        →
      </Link>
    </div>
  )
}
