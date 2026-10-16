'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { ObjectDef, RiderItemData } from '@/lib/rider-core'

import { useRiderLabels } from './labels'
import styles from './rider.module.css'

type Patch = {
  provider?: 'band' | 'venue'
  qty?: number
  mic?: string | null
  note?: string | null
}

// Une ligne d'objet : qui le fournit (bascule), entrées, détails (quantité, micro, note), retrait.
export function ItemRow({
  item,
  def,
  pending,
  onUpdate,
  onRemove,
  showProvider = true,
}: {
  item: RiderItemData
  def: ObjectDef | undefined
  pending: boolean
  onUpdate: (patch: Patch) => void
  onRemove: () => void
  showProvider?: boolean
}) {
  const t = useTranslations('rider.item')
  const l = useRiderLabels()
  const [open, setOpen] = useState(false)
  const [qty, setQty] = useState(String(item.qty))
  const [mic, setMic] = useState(item.mic ?? '')
  const [note, setNote] = useState(item.note ?? '')
  if (!def) return null
  const band = item.provider === 'band'
  const inputs = def.inputs.length * item.qty
  const defaultMic = def.mics.length ? [...new Set(def.mics.map(l.mic))].join(', ') : ''

  return (
    <li className={`${styles.item} ${showProvider && band ? styles.itemBand : ''}`}>
      <div className={styles.itemRow}>
        <span aria-hidden="true" className={styles.icon}>
          {def.icon}
        </span>
        <span className={styles.itemText}>
          <span className={styles.itemName}>
            {def.name}
            {item.qty > 1 && <span className={styles.faint}> ×{item.qty}</span>}
          </span>
          <span className={styles.faint}>
            {[item.note || def.detail, item.mic ? l.mic(item.mic) : null]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <span className={styles.faint} style={{ fontWeight: 700, textTransform: 'uppercase' }}>
          {inputs ? t('inputsShort', { count: inputs }) : def.monitor ? t('monitorShort') : ''}
        </span>
        {showProvider && (
          <button
            type="button"
            className={`${styles.small} ${band ? styles.whoBand : styles.whoVenue}`}
            aria-label={`${t('flip')} ${def.name}`}
            disabled={pending}
            onClick={() => onUpdate({ provider: band ? 'venue' : 'band' })}
          >
            {band ? t('band') : t('venue')}
          </button>
        )}
        <button
          type="button"
          className={styles.small}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {t('edit')}
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={`${t('remove')} ${def.name}`}
          disabled={pending}
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      {open && (
        <form
          className={styles.details}
          onSubmit={(e) => {
            e.preventDefault()
            onUpdate({ qty: Math.max(1, Math.min(20, Number(qty) || 1)), mic, note })
            setOpen(false)
          }}
        >
          <label className={styles.mini}>
            {t('qty')}
            <input
              type="number"
              min={1}
              max={20}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </label>
          {def.inputs.length > 0 ? (
            <label className={styles.mini}>
              {t('mic')}
              <input
                value={mic}
                maxLength={40}
                placeholder={defaultMic || t('micPlaceholder')}
                onChange={(e) => setMic(e.target.value)}
              />
            </label>
          ) : (
            <span />
          )}
          <label className={styles.mini}>
            {t('note')}
            <input
              value={note}
              maxLength={200}
              placeholder={t('notePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button type="submit" className={`${styles.small} ${styles.smallOn}`} disabled={pending}>
            {t('save')}
          </button>
        </form>
      )}
    </li>
  )
}
