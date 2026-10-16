'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { ObjectDef } from '@/lib/rider-core'

import styles from './rider.module.css'

export type CatalogGroup = { id: string; keys: string[] }

// Catalogue par catégorie ; « + » ajoute l'objet à la cible choisie.
export function CatalogPicker({
  groups,
  defs,
  targetName,
  pending,
  onAdd,
}: {
  groups: CatalogGroup[]
  defs: Record<string, ObjectDef>
  targetName: string
  pending: boolean
  onAdd: (key: string) => void
}) {
  const t = useTranslations('rider')
  const visible = groups.filter((g) => g.keys.length > 0)
  const [group, setGroup] = useState(visible[0]?.id ?? 'voice')
  const current = visible.find((g) => g.id === group) ?? visible[0]

  return (
    <>
      <div className={styles.chips} role="group" aria-label={t('catalog.title')}>
        {visible.map((g) => (
          <button
            key={g.id}
            type="button"
            className={styles.chip}
            aria-pressed={g.id === current?.id}
            onClick={() => setGroup(g.id)}
          >
            {t(`groups.${g.id}` as never)}
          </button>
        ))}
      </div>
      <ul className={styles.items}>
        {current?.keys.map((k) => {
          const d = defs[k]
          if (!d) return null
          return (
            <li key={k} className={styles.catItem}>
              <span aria-hidden="true" className={styles.icon}>
                {d.icon}
              </span>
              <span className={styles.itemText}>
                <span className={styles.itemName}>{d.name}</span>
                <span className={styles.faint}>{d.detail}</span>
              </span>
              <button
                type="button"
                className={styles.add}
                disabled={pending}
                aria-label={t('catalog.add', { obj: d.name, who: targetName })}
                onClick={() => onAdd(k)}
              >
                +
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
