import { setRequestLocale } from 'next-intl/server'
import { use } from 'react'

import { Criteria } from '@/components/home/Criteria'
import { GenreMarquee } from '@/components/home/GenreMarquee'
import { Hero } from '@/components/home/Hero'
import { JoinCta } from '@/components/home/JoinCta'
import { OpenDates } from '@/components/home/OpenDates'
import { QuickSearch } from '@/components/home/QuickSearch'
import { Setlist } from '@/components/home/Setlist'
import type { Locale } from '@/i18n/routing'

export default function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = use(params)
  setRequestLocale(locale)
  return (
    <>
      <Hero />
      <GenreMarquee />
      <QuickSearch />
      <Criteria />
      <Setlist />
      <OpenDates />
      <JoinCta />
    </>
  )
}
