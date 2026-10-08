import type { Metadata } from 'next'
import { Anton, Archivo, Permanent_Marker } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { routing } from '@/i18n/routing'

import '@/styles/globals.css'

// Polices téléchargées au build et servies par le site lui-même (aucun appel à Google côté visiteur).
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' })
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo' })
const marker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-permanent-marker',
})

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'meta' })
  return { title: t('siteName'), description: t('description') }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const t = await getTranslations('a11y')

  return (
    <html lang={locale} className={`${anton.variable} ${archivo.variable} ${marker.variable}`}>
      <body>
        <NextIntlClientProvider>
          <a href="#contenu" className="skip-link">
            {t('skip')}
          </a>
          <SiteHeader />
          <main id="contenu">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
