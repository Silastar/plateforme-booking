import type { PlotItem } from '@/db/schema'
import { PLOT_COLS, PLOT_ROWS } from '@/lib/rider-core'

import styles from './rider.module.css'

export const PLOT_ICON: Record<PlotItem['kind'], string> = {
  member: '●',
  riser: '🥁',
  object: '🔊',
  wedge: '◣',
  power: '⚡',
  note: '✎',
}

export function plotStyle(p: PlotItem, paper = false): React.CSSProperties {
  const colors: Record<PlotItem['kind'], [string, string]> = {
    member: ['var(--c-red-bright)', '#fff'],
    riser: ['var(--c-paper)', 'var(--c-ink)'],
    object: ['var(--c-amber)', 'var(--c-ink)'],
    wedge: [
      paper ? 'var(--c-paper-light)' : 'var(--c-line-strong)',
      paper ? 'var(--c-ink)' : '#fff',
    ],
    power: [
      paper ? 'var(--c-paper-light)' : 'var(--c-line-strong)',
      paper ? 'var(--c-ink)' : '#fff',
    ],
    note: ['transparent', paper ? 'var(--c-ink)' : 'var(--c-text)'],
  }
  const [bg, fg] = colors[p.kind]
  return {
    left: `calc(${(p.x / PLOT_COLS) * 100}% + 3px)`,
    top: `calc(${(p.y / PLOT_ROWS) * 100}% + 3px)`,
    width: `calc(${(p.w / PLOT_COLS) * 100}% - 6px)`,
    height: `calc(${(p.h / PLOT_ROWS) * 100}% - 6px)`,
    background: bg,
    color: fg,
    borderColor: p.kind === 'note' ? 'currentColor' : paper ? 'var(--c-ink)' : bg,
    borderStyle: p.kind === 'note' ? 'dashed' : 'solid',
    borderWidth: paper ? 2 : 3,
  }
}

// Plan de scène en lecture (page publique, aperçu).
export function PlotView({
  plot,
  audience,
  paper = false,
}: {
  plot: PlotItem[]
  audience: string
  paper?: boolean
}) {
  return (
    <div>
      <div className={styles.stage} role="img" aria-label={plot.map((p) => p.label).join(', ')}>
        {plot.map((p) => (
          <span key={p.id} className={styles.plotItem} style={plotStyle(p, paper)}>
            <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
              {PLOT_ICON[p.kind]}
            </span>
            <span>{p.label}</span>
          </span>
        ))}
      </div>
      <div className={styles.audience}>{audience}</div>
    </div>
  )
}
