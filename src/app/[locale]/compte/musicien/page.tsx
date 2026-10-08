import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { MusicianEditor } from '@/components/profiles/MusicianEditor'
import { MusicianLinks } from '@/components/profiles/MusicianLinks'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getMusicianLinks, searchBands } from '@/lib/lineup'
import { getMusicianForEdit } from '@/lib/musicians'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ q?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'editMusician' })
  return { title: t('title') }
}

export default async function EditMusicianPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const m = await getMusicianForEdit(session.user.id)
  if (!m) notFound()
  const { q = '' } = await searchParams
  const [links, results] = await Promise.all([getMusicianLinks(session.user.id), searchBands(q)])
  const t = await getTranslations('editMusician')

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
              {m.stageName}
            </h1>
          </div>
          {m.slug && (
            <Link
              href={{ pathname: '/musiciens/[slug]', params: { slug: m.slug } }}
              className="btn btn--ghost"
            >
              {t('viewPublic')}
            </Link>
          )}
        </div>
        <MusicianLinks links={links} results={results} query={q} />
        <MusicianEditor
          musician={{
            stageName: m.stageName,
            mainInstrument: m.mainInstrument,
            otherInstruments: m.otherInstruments,
            city: m.city,
            level: m.level,
            styles: m.styles,
            photo: m.photo,
            bio: m.bio,
            videoUrl: m.videoUrl,
            videoUrl2: m.videoUrl2,
            availableForSubs: m.availableForSubs,
            subInstruments: m.subInstruments,
            subRadiusKm: m.subRadiusKm,
            subNoticeDays: m.subNoticeDays,
            repertoireNote: m.repertoireNote,
            gearNote: m.gearNote,
          }}
        />
      </div>
    </section>
  )
}
