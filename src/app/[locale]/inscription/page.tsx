import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/AuthShell'
import { SignupFlow } from '@/components/auth/SignupFlow'
import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { enabledProviders } from '@/lib/auth'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.signup' })
  return { title: t('title') }
}

export default async function SignupPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  if (await getSession()) redirect({ href: '/compte', locale })
  return (
    <AuthShell>
      <SignupFlow providers={enabledProviders} />
    </AuthShell>
  )
}
