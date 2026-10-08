import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { OrgaEditor } from '@/components/profiles/OrgaEditor'
import { VenueForm } from '@/components/profiles/VenueForm'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getOrgaForEdit } from '@/lib/orgas'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'editOrga' })
  return { title: t('title') }
}

export default async function EditOrgaPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const orga = await getOrgaForEdit(session.user.id)
  if (!orga) notFound()
  const t = await getTranslations('editOrga')

  return (
    <section style={{ padding: '44px var(--gutter) 72px' }}>
      <div
        className="container"
        style={{ maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
          }}
        >
          <div>
            <Link href="/compte" className="label">
              ← {t('back')}
            </Link>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 80px)', marginTop: 10 }}>
              {orga.name}
            </h1>
          </div>
          {orga.slug && (
            <Link
              href={{ pathname: '/orgas/[slug]', params: { slug: orga.slug } }}
              className="btn btn--ghost"
            >
              {t('viewPublic')}
            </Link>
          )}
        </div>
        <OrgaEditor
          orga={{
            name: orga.name,
            type: orga.type,
            city: orga.city,
            since: orga.since,
            website: orga.website,
            description: orga.description,
            logo: orga.logo,
            cover: orga.cover,
            genres: orga.genres,
            eventTypes: orga.eventTypes,
            bandsPerNight: orga.bandsPerNight,
            setLength: orga.setLength,
            rhythm: orga.rhythm,
            budgetMin: orga.budgetMin,
            budgetMax: orga.budgetMax,
            feeTerms: orga.feeTerms,
          }}
        />
        <h2 className="display" style={{ fontSize: 48, marginTop: 24 }}>
          {t('venuesTitle')}
        </h2>
        <p style={{ margin: 0, color: 'var(--c-muted)' }}>{t('venuesIntro')}</p>
        {orga.venues.map((v, i) => (
          <VenueForm key={v.id} n={i + 1} venue={v} />
        ))}
        <VenueForm n={orga.venues.length + 1} />
      </div>
    </section>
  )
}
