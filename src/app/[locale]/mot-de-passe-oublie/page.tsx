import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/AuthShell'
import { ForgotForm } from '@/components/auth/ForgotForm'
import type { Locale } from '@/i18n/routing'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.forgot' })
  return { title: t('title') }
}

export default async function ForgotPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <AuthShell narrow>
      <ForgotForm />
    </AuthShell>
  )
}
