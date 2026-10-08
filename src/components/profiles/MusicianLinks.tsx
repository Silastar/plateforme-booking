'use client'

import { useTranslations } from 'next-intl'

import { formStyles as styles } from '@/components/forms/fields'
import { Link } from '@/i18n/navigation'
import { musicianLineupAction } from '@/lib/actions/lineup'

import { MiniForm } from './MiniForm'
import css from './profile.module.css'

type LinkView = {
  id: string
  status: string
  role: string | null
  isAdmin: boolean
  band: { id: string; name: string; slug: string | null; city: string }
}

export function MusicianLinks({
  links,
  results,
  query,
}: {
  links: LinkView[]
  results: { id: string; name: string; city: string; slug: string | null }[]
  query: string
}) {
  const t = useTranslations('lineup')
  const invites = links.filter((l) => l.status === 'invited')
  const requests = links.filter((l) => l.status === 'requested')
  const bands = links.filter((l) => l.status === 'active')
  const linked = new Set(links.map((l) => l.band.id))
  const bandLink = (l: LinkView) =>
    l.band.slug ? (
      <Link href={{ pathname: '/groupes/[slug]', params: { slug: l.band.slug } }}>
        {l.band.name}
      </Link>
    ) : (
      l.band.name
    )

  return (
    <div className={`${styles.form} ${styles.accentMusicien}`}>
      {invites.map((l) => (
        <div
          key={l.id}
          className={css.facade}
          style={{ borderStyle: 'solid', borderColor: 'var(--c-red)' }}
        >
          <span>
            <strong>{t('inviteFrom', { band: l.band.name })}</strong>
            {l.role ? ` · ${l.role}` : ''}
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            <MiniForm action={musicianLineupAction} hidden={{ memberId: l.id, op: 'accept' }}>
              {({ pending }) => (
                <button type="submit" className="btn btn--red" disabled={pending}>
                  {t('accept')}
                </button>
              )}
            </MiniForm>
            <MiniForm action={musicianLineupAction} hidden={{ memberId: l.id, op: 'decline' }}>
              {({ pending }) => (
                <button type="submit" className="btn btn--ghost" disabled={pending}>
                  {t('decline')}
                </button>
              )}
            </MiniForm>
          </span>
        </div>
      ))}

      <section className={styles.section}>
        <h2 className={styles.legend}>{t('myBands')}</h2>
        {bands.length === 0 && <p className={styles.sectionIntro}>{t('noBands')}</p>}
        {bands.map((l) => (
          <div key={l.id} className={css.facade}>
            <span>
              <strong>{bandLink(l)}</strong> · {l.band.city}
              {l.role ? ` · ${l.role}` : ''}
            </span>
            <MiniForm
              action={musicianLineupAction}
              hidden={{ memberId: l.id, op: 'leave' }}
              confirm={t('confirmLeave', { band: l.band.name })}
            >
              {({ pending }) => (
                <button type="submit" className="btn btn--ghost" disabled={pending}>
                  {t('leave')}
                </button>
              )}
            </MiniForm>
          </div>
        ))}
        {requests.map((l) => (
          <div key={l.id} className={css.facade}>
            <span>{t('requestSent', { band: l.band.name })}</span>
            <MiniForm action={musicianLineupAction} hidden={{ memberId: l.id, op: 'cancel' }}>
              {({ pending }) => (
                <button type="submit" className="btn btn--ghost" disabled={pending}>
                  {t('cancelRequest')}
                </button>
              )}
            </MiniForm>
          </div>
        ))}

        <form method="get" className={styles.bar} style={{ alignItems: 'flex-end' }} role="search">
          <label className={styles.field} style={{ flex: '1 1 260px' }}>
            {t('searchLabel')}
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t('searchPlaceholder')}
            />
          </label>
          <button type="submit" className="btn btn--paper">
            {t('search')}
          </button>
        </form>
        {query && results.length === 0 && <p className={styles.sectionIntro}>{t('noResults')}</p>}
        {results.map((r) => (
          <div key={r.id} className={css.facade}>
            <span>
              <strong>{r.name}</strong> · {r.city}
            </span>
            {linked.has(r.id) ? (
              <span className={styles.help}>{t('alreadyLinked')}</span>
            ) : (
              <MiniForm action={musicianLineupAction} hidden={{ bandId: r.id, op: 'request' }}>
                {({ pending }) => (
                  <button type="submit" className="btn btn--red" disabled={pending}>
                    {t('askToJoin')}
                  </button>
                )}
              </MiniForm>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
