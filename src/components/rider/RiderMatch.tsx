import { getTranslations } from 'next-intl/server'

import type { Check } from '@/lib/rider-core'

import styles from './rider.module.css'

const MARK = { ok: '✓', sub: '≈', missing: '✕', unknown: '?' } as const
const COLOR = {
  ok: 'var(--c-amber)',
  sub: 'var(--c-text-soft)',
  missing: 'var(--c-red-text)',
  unknown: 'var(--c-faint)',
} as const
const BAR = {
  ok: 'var(--c-amber)',
  sub: 'var(--c-line-strong)',
  missing: 'var(--c-red-bright)',
  unknown: 'var(--c-line)',
}

// Ce que demande la fiche face au matériel déclaré du lieu.
export async function RiderMatch({
  checks,
  ok,
  total,
  known,
}: {
  checks: Check[]
  ok: number
  total: number
  known: boolean
}) {
  const t = await getTranslations('rider.match')
  // Clés construites à partir du type de vérification (console, wedge…).
  const tk = t as unknown as (key: string, values: Record<string, string | number>) => string
  const status = (c: Check) => {
    if (c.status === 'sub') return t('sub')
    if (c.status === 'unknown') return t('unknownStatus')
    if (c.have !== undefined)
      return c.status === 'ok'
        ? t('okCount', { have: c.have })
        : t('missingCount', { have: c.have })
    return c.status === 'ok' ? t('ok') : t('missing')
  }
  return (
    <>
      <h2 className={styles.h2}>{known ? t('title', { ok, total }) : t('unknownTitle')}</h2>
      <div className={styles.bar} aria-hidden="true">
        {checks.map((c, i) => (
          <span key={i} style={{ background: BAR[c.status] }} />
        ))}
      </div>
      <ul className={styles.checks}>
        {checks.map((c, i) => (
          <li key={i}>
            <span style={{ fontWeight: 800, color: COLOR[c.status], width: 18, flex: '0 0 18px' }}>
              {MARK[c.status]}
            </span>
            <span>
              <strong>{tk(c.kind, { need: c.need, model: c.model ?? '' })}</strong>
              <span style={{ color: 'var(--c-muted)' }}> · {status(c)}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  )
}
