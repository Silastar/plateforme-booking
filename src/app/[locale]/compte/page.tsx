import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/auth/auth.module.css'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAdminBands } from '@/lib/bands'
import { getSession } from '@/lib/session'

type Props = {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ verifie?: string }>
}

const ROLE_KEYS = ['orga', 'groupe', 'musicien', 'admin', 'none'] as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'auth.account' })
  return { title: t('title') }
}

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const { user } = session
  const userRole = user.role ?? 'none'
  if (userRole === 'none') return redirect({ href: '/inscription/profil', locale })
  const { verifie } = await searchParams
  const bands = await getAdminBands(user.id)
  const t = await getTranslations('auth.account')
  const role = (ROLE_KEYS as readonly string[]).includes(userRole)
    ? (userRole as (typeof ROLE_KEYS)[number])
    : 'none'

  return (
    <section style={{ padding: '56px var(--gutter) 80px' }}>
      <div
        className="container"
        style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {verifie && (
          <p role="status" className={styles.success}>
            {t('verified')}
          </p>
        )}
        <h1 className={`display ${styles.title}`}>
          {t('heading', { name: user.name.split(' ')[0] })}
        </h1>
        {user.status === 'pending' && (
          <div className={styles.alert} style={{ borderLeftColor: 'var(--c-amber)' }}>
            <strong>{t('pendingTitle')}</strong>
            <p style={{ margin: '6px 0 0' }}>{t('pendingText')}</p>
          </div>
        )}
        <dl
          style={{
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'max-content 1fr',
            gap: '10px 24px',
            background: 'var(--c-surface)',
            padding: 24,
          }}
        >
          <dt className="label" style={{ color: 'var(--c-faint)' }}>
            {t('role')}
          </dt>
          <dd style={{ margin: 0, fontWeight: 700 }}>{t(`roles.${role}`)}</dd>
          <dt className="label" style={{ color: 'var(--c-faint)' }}>
            {t('email')}
          </dt>
          <dd style={{ margin: 0, fontWeight: 700, overflowWrap: 'anywhere' }}>{user.email}</dd>
        </dl>
        {bands.length > 0 && (
          <section
            aria-labelledby="my-profiles"
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <h2 id="my-profiles" className="display" style={{ fontSize: 36 }}>
              {t('myProfiles')}
            </h2>
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {bands.map((b) => (
                <li
                  key={b.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    background: 'var(--c-surface)',
                    borderLeft: '8px solid var(--c-red)',
                    padding: '16px 20px',
                  }}
                >
                  <span className="display" style={{ fontSize: 28 }}>
                    {b.name}
                  </span>
                  <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {b.slug && (
                      <Link
                        href={{ pathname: '/groupes/[slug]', params: { slug: b.slug } }}
                        className="btn btn--ghost"
                      >
                        {t('viewPage')}
                      </Link>
                    )}
                    <Link
                      href={{ pathname: '/compte/groupe/[id]', params: { id: b.id } }}
                      className="btn btn--red"
                    >
                      {t('editBand')}
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <p className={styles.muted}>{t('next')}</p>
        <div>
          <LogoutButton label={t('logout')} />
        </div>
      </div>
    </section>
  )
}
