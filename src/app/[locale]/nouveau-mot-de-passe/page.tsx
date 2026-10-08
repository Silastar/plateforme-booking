import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/AuthShell'
import { ResetForm } from '@/components/auth/ResetForm'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ token?: string; error?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.reset' })
  return { title: t('title') }
}

export default async function ResetPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const { token, error } = await searchParams
  return (
    <AuthShell narrow>
      <ResetForm token={token ?? ''} invalid={Boolean(error)} />
    </AuthShell>
  )
}
