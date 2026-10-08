import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/auth/auth.module.css'
import { AuthShell } from '@/components/auth/AuthShell'
import { OnboardingForm } from '@/components/auth/OnboardingForm'
import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getSession } from '@/lib/session'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ role?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.onboarding' })
  return { title: t('title') }
}

export default async function OnboardingPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  if (session.user.role !== 'none') return redirect({ href: '/compte', locale })
  const { role } = await searchParams
  const t = await getTranslations('auth.onboarding')
  return (
    <AuthShell>
      <h1 className={`display ${styles.title}`}>{t('heading')}</h1>
      <p className={styles.intro}>{t('text')}</p>
      <OnboardingForm initialRole={role ?? null} />
    </AuthShell>
  )
}
