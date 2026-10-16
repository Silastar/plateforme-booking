'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import {
  addRiderItem,
  createCustomObject,
  importMemberGear,
  removeRiderItem,
  updateRiderItem,
} from '@/lib/actions/rider'
import type { ObjectDef, RiderItemData } from '@/lib/rider-core'

import { CatalogPicker, type CatalogGroup } from './CatalogPicker'
import { CustomObjectForm } from './CustomObjectForm'
import { ItemRow } from './ItemRow'
import styles from './rider.module.css'
import { useMutation } from './useMutation'

export type EditorMember = { id: string; name: string; role: string | null; hasGear: boolean }

// Cartes par membre (et « tout le groupe ») + catalogue : un clic sur « + » ajoute au membre choisi.
export function MembersCatalog({
  riderId,
  members,
  items,
  defs,
  groups,
}: {
  riderId: string
  members: EditorMember[]
  items: RiderItemData[]
  defs: Record<string, ObjectDef>
  groups: CatalogGroup[]
}) {
  const t = useTranslations('rider')
  const { pending, run } = useMutation()
  const [target, setTarget] = useState<string>(members[0]?.id ?? '')
  const [imported, setImported] = useState<string | null>(null)
  const cards = [
    ...members,
    { id: '', name: t('members.common'), role: t('members.commonRole'), hasGear: false },
  ]
  const targetCard = cards.find((m) => m.id === target) ?? cards[0]

  return (
    <div className={styles.layout}>
      <div className={styles.col}>
        <div className={styles.headRow}>
          <h2 className={styles.h2} style={{ fontSize: 40 }}>
            {t('members.title')}
          </h2>
          <span className={styles.faint}>{t('members.hint')}</span>
        </div>
        {cards.map((m) => {
          const list = items.filter((i) => (i.memberId ?? '') === m.id)
          const inputs = list.reduce(
            (n, i) => n + (defs[i.objectKey]?.inputs.length ?? 0) * i.qty,
            0,
          )
          const on = m.id === targetCard.id
          return (
            <section
              key={m.id || 'common'}
              aria-label={m.name}
              className={`${styles.member} ${on ? styles.memberOn : ''}`}
            >
              <div className={styles.memberHead}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className={styles.memberName}>{m.name}</span>
                  <span className={styles.faint}>
                    {[m.role, t('members.inputs', { count: inputs })].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className={styles.toolbar}>
                  {m.hasGear && (
                    <button
                      type="button"
                      className={styles.small}
                      disabled={pending}
                      onClick={() =>
                        run(async () => {
                          const r = await importMemberGear(riderId, m.id)
                          if (r.ok) setImported(m.id)
                        })
                      }
                    >
                      {t('members.import')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={`${styles.small} ${on ? styles.smallOn : ''}`}
                    aria-pressed={on}
                    onClick={() => setTarget(m.id)}
                  >
                    {on ? t('members.selected') : t('members.select')}
                  </button>
                </div>
              </div>
              {imported === m.id && (
                <p role="status" className={styles.faint} style={{ margin: 0 }}>
                  {t('members.importDone')}
                </p>
              )}
              {list.length === 0 ? (
                <p className={styles.faint} style={{ margin: 0 }}>
                  {t('members.empty')}
                </p>
              ) : (
                <ul className={styles.items}>
                  {list.map((i) => (
                    <ItemRow
                      key={i.id}
                      item={i}
                      def={defs[i.objectKey]}
                      pending={pending}
                      onUpdate={(patch) => run(() => updateRiderItem(i.id, patch))}
                      onRemove={() => run(() => removeRiderItem(i.id))}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <aside className={styles.aside} aria-labelledby="catalog">
        <section className={`${styles.panel} ${styles.panelRed}`}>
          <h2 id="catalog" className={styles.h2}>
            {t('catalog.title')}
          </h2>
          <p className={styles.muted}>
            {t('catalog.addTo')}{' '}
            <strong style={{ color: 'var(--c-text)' }}>{targetCard.name}</strong>
          </p>
          <CatalogPicker
            groups={groups}
            defs={defs}
            targetName={targetCard.name}
            pending={pending}
            onAdd={(key) => run(() => addRiderItem(riderId, targetCard.id || null, key))}
          />
          <CustomObjectForm
            action={createCustomObject}
            fields={{ riderId, memberId: targetCard.id }}
          />
        </section>
      </aside>
    </div>
  )
}
