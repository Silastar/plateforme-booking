import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  return (
    <section style={{ padding: '96px var(--gutter)' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 8vw, 110px)' }}>
          {t('title')}
        </h1>
        <p style={{ margin: 0, fontSize: 19, color: 'var(--c-text-soft)' }}>{t('text')}</p>
        <Link href="/" className="btn btn--amber" style={{ alignSelf: 'flex-start' }}>
          {t('back')}
        </Link>
      </div>
    </section>
  )
}
