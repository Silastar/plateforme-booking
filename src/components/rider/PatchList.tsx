'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { setPatchOrder } from '@/lib/actions/rider'
import { patchRows, type MemberData, type ObjectDef, type RiderItemData } from '@/lib/rider-core'

import { useRiderLabels } from './labels'
import styles from './rider.module.css'
import { useMutation } from './useMutation'

// Liste des entrées générée ; les flèches réordonnent (affichage immédiat, puis enregistrement).
export function PatchList({
  riderId,
  items,
  defs,
  members,
  order,
  editable,
}: {
  riderId?: string
  items: RiderItemData[]
  defs: Record<string, ObjectDef>
  members: MemberData[]
  order: string[]
  editable: boolean
}) {
  const t = useTranslations('rider.patch')
  const l = useRiderLabels()
  const { pending, run } = useMutation()
  const [local, setLocal] = useState<string[] | null>(null)
  const rows = patchRows(items, defs, members, local ?? order)
  if (rows.length === 0) return <p className={styles.faint}>{t('empty')}</p>

  const move = (i: number, d: number) => {
    const keys = rows.map((r) => r.key)
    const j = i + d
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
    setLocal(keys)
    if (riderId) run(() => setPatchOrder(riderId, keys))
  }

  return (
    <div role="table" aria-label={t('title')} className={styles.patch}>
      <div role="row" className={`${styles.patchRow} ${styles.patchHead}`}>
        <span role="columnheader">#</span>
        <span role="columnheader">{t('source')}</span>
        <span role="columnheader">{t('mic')}</span>
        <span role="columnheader" className={styles.hideSm}>
          {t('stand')}
        </span>
        <span role="columnheader" className={editable ? styles.hideSm : undefined}>
          {t('member')}
        </span>
        {editable && <span role="columnheader" />}
      </div>
      {rows.map((r, i) => (
        <div role="row" key={r.key} className={styles.patchRow}>
          <span role="cell" className={styles.patchN}>
            {i + 1}
          </span>
          <span role="cell" style={{ fontWeight: 800 }}>
            {r.source}
          </span>
          <span role="cell">{l.mic(r.mic)}</span>
          <span role="cell" className={styles.hideSm}>
            {l.stand(r.stand)}
          </span>
          <span role="cell" className={`${styles.faint} ${editable ? styles.hideSm : ''}`}>
            {r.memberName}
          </span>
          {editable && (
            <span role="cell" style={{ whiteSpace: 'nowrap' }}>
              <button
                type="button"
                className={styles.arrow}
                disabled={i === 0 || pending}
                aria-label={t('up', { src: r.source })}
                onClick={() => move(i, -1)}
              >
                ↑
              </button>{' '}
              <button
                type="button"
                className={styles.arrow}
                disabled={i === rows.length - 1 || pending}
                aria-label={t('down', { src: r.source })}
                onClick={() => move(i, 1)}
              >
                ↓
              </button>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
