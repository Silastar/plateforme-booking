import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { AuthShell } from '@/components/auth/AuthShell'
import { LoginForm } from '@/components/auth/LoginForm'
import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { enabledProviders } from '@/lib/auth'
import { getSession } from '@/lib/session'

type Props = { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.login' })
  return { title: t('title') }
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  if (await getSession()) redirect({ href: '/compte', locale })
  return (
    <AuthShell narrow>
      <LoginForm providers={enabledProviders} />
    </AuthShell>
  )
}
