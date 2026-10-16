import { getTranslations } from 'next-intl/server'

import type { PlotItem } from '@/db/schema'
import type { MemberData, MonitorMix, ObjectDef, RiderItemData } from '@/lib/rider-core'
import type { RiderFull } from '@/lib/riders'

import { PatchList } from './PatchList'
import { PlotView } from './PlotView'
import styles from './rider.module.css'

// Fiche technique en lecture, façon feuille scotchée : entrées, plan, retours, accueil, en bref.
export async function RiderSheet({
  bandName,
  rider,
  items,
  defs,
  members,
  mixes,
  plot,
  stats,
}: {
  bandName: string
  rider: RiderFull
  items: RiderItemData[]
  defs: Record<string, ObjectDef>
  members: MemberData[]
  mixes: MonitorMix[]
  plot: PlotItem[]
  stats: { inputs: number; mixes: number }
}) {
  const t = await getTranslations('rider')
  const hosp = [
    [t('hosp.people'), rider.people !== null ? String(rider.people) : null],
    [t('hosp.meals'), rider.meals],
    [t('hosp.greenRoom'), rider.greenRoom],
    [t('hosp.drinks'), rider.drinks],
    [t('hosp.parking'), rider.parking],
    [t('hosp.lodging'), rider.lodging],
  ].filter(([, v]) => v) as [string, string][]
  const minutes = (n: number | null) => (n !== null ? t('general.minutes', { n }) : null)
  const general = [
    [t('general.engineer'), rider.engineer || t('general.venueEngineer')],
    [t('general.setup').replace(/ \(.*\)/, ''), minutes(rider.setupMinutes)],
    [t('general.soundcheck').replace(/ \(.*\)/, ''), minutes(rider.soundcheckMinutes)],
    [t('general.changeover').replace(/ \(.*\)/, ''), minutes(rider.changeoverMinutes)],
    [t('general.minStage'), rider.minStage],
  ].filter(([, v]) => v) as [string, string][]
  const seen = new Set<string>()

  return (
    <article className={styles.paper}>
      <span aria-hidden="true" className={styles.tape} />
      <div className={styles.paperHead}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label" style={{ color: 'var(--c-red-dark)' }}>
            {t('public.by')}
          </span>
          <span className={styles.paperTitle}>{bandName}</span>
          <span style={{ color: 'var(--c-on-paper-soft)', fontWeight: 700 }}>
            {rider.name} · {stats.inputs} {t('stats.inputs')} · {stats.mixes} {t('stats.mixes')}
          </span>
        </div>
      </div>

      <section
        aria-label={t('patch.title')}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <h2 className={styles.paperH2}>{t('patch.title')}</h2>
        <PatchList
          items={items}
          defs={defs}
          members={members}
          order={rider.patchOrder}
          editable={false}
        />
      </section>

      {plot.length > 0 && (
        <section
          aria-label={t('plot.title')}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <h2 className={styles.paperH2}>{t('plot.title')}</h2>
          <PlotView plot={plot} audience={t('plot.audience')} paper />
        </section>
      )}

      {(mixes.length > 0 || rider.iemNote) && (
        <section
          aria-label={t('monitorsSection.title')}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <h2 className={styles.paperH2}>{t('monitorsSection.title')}</h2>
          <ul
            style={{
              margin: 0,
              paddingLeft: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              lineHeight: 1.45,
            }}
          >
            {mixes.map((m, i) => {
              const key = m.memberId ?? 'common'
              const note = !seen.has(key) ? rider.monitorNotes[key] : undefined
              seen.add(key)
              return (
                <li key={m.itemId + i}>
                  <strong>
                    {t('monitorsSection.mix', { n: i + 1 })} · {m.memberName || t('members.common')}
                  </strong>{' '}
                  : {t(`monitors.${m.kind}` as never)}
                  {note && <span style={{ color: 'var(--c-on-paper-soft)' }}> · {note}</span>}
                </li>
              )
            })}
          </ul>
          {rider.iemNote && <p style={{ margin: 0 }}>{rider.iemNote}</p>}
        </section>
      )}

      {hosp.length > 0 && (
        <section
          aria-label={t('hosp.title')}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <h2 className={styles.paperH2}>{t('hosp.title')}</h2>
          <dl className={styles.facts}>
            {hosp.map(([k, v]) => (
              <div key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section
        aria-label={t('general.title')}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <h2 className={styles.paperH2}>{t('general.title')}</h2>
        <dl className={styles.facts}>
          {general.map(([k, v]) => (
            <div key={k} style={{ display: 'contents' }}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  )
}
