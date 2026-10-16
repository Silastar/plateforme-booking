'use client'

import { useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import type { PlotItem } from '@/db/schema'
import { savePlot } from '@/lib/actions/rider'
import { PLOT_COLS, PLOT_ROWS } from '@/lib/rider-core'

import { PLOT_ICON, plotStyle } from './PlotView'
import styles from './rider.module.css'

const occupied = (plot: PlotItem[], except?: string) => {
  const cells = new Set<string>()
  for (const p of plot)
    if (p.id !== except)
      for (let dx = 0; dx < p.w; dx++)
        for (let dy = 0; dy < p.h; dy++) cells.add(`${p.x + dx}:${p.y + dy}`)
  return cells
}

// Grille vue de dessus : clic sur un élément, puis sur une case pour l'y poser.
export function PlotEditor({
  riderId,
  initial,
  auto,
}: {
  riderId: string
  initial: PlotItem[]
  auto: PlotItem[]
}) {
  const t = useTranslations('rider.plot')
  const [plot, setPlot] = useState<PlotItem[]>(initial.length ? initial : auto)
  const [selected, setSelected] = useState<string | null>(null)
  const [dirty, setDirty] = useState(initial.length === 0 && auto.length > 0)
  const [saved, setSaved] = useState(false)
  const [note, setNote] = useState('')
  const [pending, startTransition] = useTransition()
  const sel = plot.find((p) => p.id === selected)

  const update = (next: PlotItem[]) => {
    setPlot(next)
    setDirty(true)
    setSaved(false)
  }

  const place = (x: number, y: number) => {
    if (!sel) return
    const nx = Math.min(x, PLOT_COLS - sel.w)
    const ny = Math.min(y, PLOT_ROWS - sel.h)
    update(plot.map((p) => (p.id === sel.id ? { ...p, x: nx, y: ny } : p)))
    setSelected(null)
  }

  // Nouvel élément sur la première case libre.
  const add = (kind: PlotItem['kind'], label: string, w = 1, h = 1) => {
    const taken = occupied(plot)
    for (let y = PLOT_ROWS - h; y >= 0; y--)
      for (let x = 0; x <= PLOT_COLS - w; x++) {
        let free = true
        for (let dx = 0; dx < w; dx++)
          for (let dy = 0; dy < h; dy++) if (taken.has(`${x + dx}:${y + dy}`)) free = false
        if (free) {
          const id = `${kind}-${Date.now().toString(36)}`
          update([...plot, { id, kind, label, x, y, w, h }])
          setSelected(id)
          return
        }
      }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p className={styles.faint} style={{ margin: 0 }} aria-live="polite">
        {sel ? t('hintPlace', { obj: sel.label }) : t('hint')}
      </p>
      <div>
        <div className={styles.stage}>
          <div className={styles.cells}>
            {Array.from({ length: PLOT_COLS * PLOT_ROWS }, (_, k) => {
              const x = k % PLOT_COLS
              const y = Math.floor(k / PLOT_COLS)
              return (
                <button
                  key={k}
                  type="button"
                  tabIndex={sel ? 0 : -1}
                  className={`${styles.cell} ${sel ? styles.cellActive : ''}`}
                  aria-label={t('cell', { x: x + 1, y: y + 1 })}
                  onClick={() => place(x, y)}
                />
              )
            })}
          </div>
          {plot.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.plotItem} ${p.id === selected ? styles.plotSelected : ''}`}
              style={plotStyle(p)}
              aria-pressed={p.id === selected}
              aria-label={t('select', { obj: p.label })}
              onClick={() => setSelected(p.id === selected ? null : p.id)}
            >
              <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
                {PLOT_ICON[p.kind]}
              </span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
        <div className={styles.audience}>{t('audience')}</div>
      </div>
      <div className={styles.toolbar}>
        <span className={styles.faint}>{t('add')} :</span>
        <button type="button" className={styles.small} onClick={() => add('wedge', t('wedge'))}>
          + {t('addWedge')}
        </button>
        <button type="button" className={styles.small} onClick={() => add('power', t('power'))}>
          + {t('addPower')}
        </button>
        <button
          type="button"
          className={styles.small}
          onClick={() => add('riser', t('riser'), 2, 2)}
        >
          + {t('addRiser')}
        </button>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <label className={styles.mini} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: -9999 }}>{t('addNote')}</span>
            <input
              value={note}
              maxLength={40}
              placeholder={t('notePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
              style={{ width: 140 }}
            />
          </label>
          <button
            type="button"
            className={styles.small}
            disabled={!note.trim()}
            onClick={() => {
              add('note', note.trim(), 2, 1)
              setNote('')
            }}
          >
            + {t('addNote')}
          </button>
        </span>
      </div>
      <div className={styles.toolbar}>
        {sel && (
          <button
            type="button"
            className={styles.small}
            onClick={() => {
              update(plot.filter((p) => p.id !== sel.id))
              setSelected(null)
            }}
          >
            {t('remove')}
          </button>
        )}
        <button
          type="button"
          className={styles.small}
          onClick={() => {
            update(auto)
            setSelected(null)
          }}
        >
          {t('reset')}
        </button>
        <button
          type="button"
          className={`${styles.small} ${styles.smallOn}`}
          disabled={pending || !dirty}
          onClick={() =>
            startTransition(async () => {
              const r = await savePlot(riderId, plot)
              if (r.ok) {
                setDirty(false)
                setSaved(true)
              }
            })
          }
        >
          {t('save')}
        </button>
        {saved && (
          <span role="status" className={styles.faint}>
            {t('saved')}
          </span>
        )}
      </div>
    </div>
  )
}
