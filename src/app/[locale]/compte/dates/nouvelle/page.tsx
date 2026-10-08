import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { GigForm } from '@/components/gigs/GigForm'
import styles from '@/components/gigs/gigs.module.css'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { todayIso } from '@/lib/calendar'
import { venuesForForm } from '@/lib/gig-venues'
import { getOrgaForEdit } from '@/lib/orgas'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gigs.form' })
  return { title: t('titleNew') }
}

export default async function NewGigPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const orga = await getOrgaForEdit(session.user.id)
  if (!orga) notFound()
  const t = await getTranslations('gigs.form')

  return (
    <section className={styles.page}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <Link href="/compte/dates" className="label">
            ← {t('back')}
          </Link>
          <h1 className={`display ${styles.pageTitle}`} style={{ marginTop: 10 }}>
            {t('titleNew')}
          </h1>
        </div>
        <GigForm
          orga={{ name: orga.name, city: orga.city, capacity: orga.capacity }}
          venues={await venuesForForm(orga.venues)}
          today={todayIso()}
        />
      </div>
    </section>
  )
}
