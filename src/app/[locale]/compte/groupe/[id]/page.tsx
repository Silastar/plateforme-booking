import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { BandEditor } from '@/components/profiles/BandEditor'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getBandForEdit } from '@/lib/bands'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'editBand' })
  return { title: t('title') }
}

export default async function EditBandPage({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const band = await getBandForEdit(id, session.user.id)
  if (!band) notFound()
  const t = await getTranslations('editBand')

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
              {band.name}
            </h1>
          </div>
          {band.slug && (
            <Link
              href={{ pathname: '/groupes/[slug]', params: { slug: band.slug } }}
              className="btn btn--ghost"
            >
              {t('viewPublic')}
            </Link>
          )}
        </div>
        <BandEditor
          band={{
            id: band.id,
            name: band.name,
            city: band.city,
            since: band.since,
            musiciansCount: band.musiciansCount,
            mainGenre: band.mainGenre,
            genres: band.genres,
            repertoire: band.repertoire,
            setMin: band.setMin,
            setMax: band.setMax,
            listenUrl: band.listenUrl,
            photo: band.photo,
            bio: band.bio,
            story: band.story,
            discography: band.discography,
            press: band.press,
            spotifyUrl: band.spotifyUrl,
            bandcampUrl: band.bandcampUrl,
            soundcloudUrl: band.soundcloudUrl,
            youtubeUrl: band.youtubeUrl,
            rider: band.rider,
            lineupDetail: band.lineupDetail,
            backline: band.backline,
            ownEngineer: band.ownEngineer,
            setupMinutes: band.setupMinutes,
            minStage: band.minStage,
            radiusKm: band.radiusKm,
            regions: band.regions,
            feeMin: band.feeMin,
            feeMax: band.feeMax,
            feeNote: band.feeNote,
          }}
        />
      </div>
    </section>
  )
}
