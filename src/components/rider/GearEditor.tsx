'use client'

import { useTranslations } from 'next-intl'

import { addGear, createGearCustom, removeGear, updateGear } from '@/lib/actions/rider'
import type { ObjectDef, RiderItemData } from '@/lib/rider-core'

import { CatalogPicker, type CatalogGroup } from './CatalogPicker'
import { CustomObjectForm } from './CustomObjectForm'
import { ItemRow } from './ItemRow'
import styles from './rider.module.css'
import { useMutation } from './useMutation'

// « Mon matériel » du musicien, importable dans les fiches de ses groupes.
export function GearEditor({
  items,
  defs,
  groups,
  name,
}: {
  items: RiderItemData[]
  defs: Record<string, ObjectDef>
  groups: CatalogGroup[]
  name: string
}) {
  const t = useTranslations('editMusician.gear')
  const { pending, run } = useMutation()
  return (
    <section
      className={styles.panel}
      aria-labelledby="gear"
      style={{ borderTop: '6px solid var(--c-paper)' }}
    >
      <h2 id="gear" className={styles.h2}>
        {t('title')}
      </h2>
      <p className={styles.muted}>{t('intro')}</p>
      <div className={styles.layout} style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        <div className={styles.col}>
          {items.length === 0 ? (
            <p className={styles.faint} style={{ margin: 0 }}>
              {t('empty')}
            </p>
          ) : (
            <ul className={styles.items}>
              {items.map((i) => (
                <ItemRow
                  key={i.id}
                  item={i}
                  def={defs[i.objectKey]}
                  pending={pending}
                  showProvider={false}
                  onUpdate={(patch) => run(() => updateGear(i.id, patch))}
                  onRemove={() => run(() => removeGear(i.id))}
                />
              ))}
            </ul>
          )}
        </div>
        <div className={styles.col}>
          <CatalogPicker
            groups={groups}
            defs={defs}
            targetName={name}
            pending={pending}
            onAdd={(key) => run(() => addGear(key))}
          />
          <CustomObjectForm action={createGearCustom} fields={{}} />
        </div>
      </div>
    </section>
  )
}
