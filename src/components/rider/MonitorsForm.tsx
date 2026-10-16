'use client'

import { useTranslations } from 'next-intl'

import { FormStatus, useEditForm } from '@/components/profiles/SaveBar'
import { saveMonitors } from '@/lib/actions/rider'
import type { MonitorMix } from '@/lib/rider-core'

import { useRiderLabels } from './labels'
import styles from './rider.module.css'

// Un mix par retour, avec ce que chaque membre veut entendre, et la note in-ear.
export function MonitorsForm({
  riderId,
  mixes,
  notes,
  iemNote,
}: {
  riderId: string
  mixes: MonitorMix[]
  notes: Record<string, string>
  iemNote: string | null
}) {
  const t = useTranslations('rider.monitorsSection')
  const l = useRiderLabels()
  const { state, pending, onSubmit, formRef } = useEditForm(saveMonitors)
  // Une note par membre, même s'il a plusieurs retours.
  const seen = new Set<string>()

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <input type="hidden" name="riderId" value={riderId} />
      {mixes.length === 0 ? (
        <p className={styles.faint} style={{ margin: 0 }}>
          {t('empty')}
        </p>
      ) : (
        <div className={styles.mixes}>
          {mixes.map((m, i) => {
            const key = m.memberId ?? 'common'
            const first = !seen.has(key)
            seen.add(key)
            return (
              <div key={m.itemId + i} className={styles.mix}>
                <span
                  className={styles.faint}
                  style={{ fontWeight: 800, textTransform: 'uppercase' }}
                >
                  {t('mix', { n: i + 1 })}
                </span>
                <strong>{m.memberName || '—'}</strong>
                <span className={styles.faint}>{l.monitor(m.kind)}</span>
                {first && (
                  <label className={styles.mini}>
                    <span style={{ position: 'absolute', left: -9999 }}>
                      {t('notePlaceholder')} · {m.memberName}
                    </span>
                    <input
                      name={`note-${key}`}
                      maxLength={160}
                      defaultValue={notes[key] ?? ''}
                      placeholder={t('notePlaceholder')}
                    />
                  </label>
                )}
              </div>
            )
          })}
        </div>
      )}
      <label className={styles.mini}>
        {t('iem')}
        <textarea
          name="iemNote"
          rows={2}
          maxLength={400}
          defaultValue={iemNote ?? ''}
          placeholder={t('iemPlaceholder')}
        />
      </label>
      <div className={styles.toolbar}>
        <button type="submit" className={`${styles.small} ${styles.smallOn}`} disabled={pending}>
          {t('save')}
        </button>
        <FormStatus state={state} />
      </div>
    </form>
  )
}
