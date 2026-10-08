import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { GigForm } from '@/components/gigs/GigForm'
import styles from '@/components/gigs/gigs.module.css'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { todayIso } from '@/lib/calendar'
import { venuesForForm } from '@/lib/gig-venues'
import { getGigForOrga } from '@/lib/gigs'
import { getOrgaForEdit } from '@/lib/orgas'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gigs.form' })
  return { title: t('titleEdit') }
}

export default async function EditGigPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const [orga, gig] = await Promise.all([
    getOrgaForEdit(session.user.id),
    getGigForOrga(id, session.user.id),
  ])
  if (!orga || !gig || gig.status !== 'open') notFound()
  const t = await getTranslations('gigs.form')

  return (
    <section className={styles.page}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Link href={{ pathname: '/compte/dates', query: { date: gig.id } }} className="label">
            ← {t('back')}
          </Link>
          <h1 className={`display ${styles.pageTitle}`} style={{ marginTop: 10 }}>
            {t('titleEdit')}
          </h1>
        </div>
        <GigForm
          orga={{ name: orga.name, city: orga.city, capacity: orga.capacity }}
          venues={await venuesForForm(orga.venues)}
          today={todayIso()}
          gig={{
            id: gig.id,
            venueId: gig.venueId,
            day: gig.day,
            loadIn: gig.loadIn,
            setStart: gig.setStart,
            curfew: gig.curfew,
            genres: gig.genres,
            format: gig.format,
            bandsCount: gig.bandsCount,
            setLength: gig.setLength,
            budgetMin: gig.budgetMin,
            budgetMax: gig.budgetMax,
            includes: gig.includes,
            visibility: gig.visibility,
            note: gig.note,
          }}
        />
      </div>
    </section>
  )
}
