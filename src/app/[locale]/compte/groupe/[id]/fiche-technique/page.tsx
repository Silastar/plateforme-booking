import { inArray } from 'drizzle-orm'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ConfigActions, NewConfigForm } from '@/components/rider/ConfigTools'
import { MembersCatalog } from '@/components/rider/MembersCatalog'
import { MonitorsForm } from '@/components/rider/MonitorsForm'
import { PatchList } from '@/components/rider/PatchList'
import { PlotEditor } from '@/components/rider/PlotEditor'
import styles from '@/components/rider/rider.module.css'
import { RiderInfoForm } from '@/components/rider/RiderInfoForm'
import { db } from '@/db'
import { musicianGear } from '@/db/schema'
import { Link, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getBandForEdit } from '@/lib/bands'
import { defaultPlot, monitorMixes, patchRows, riderStats } from '@/lib/rider-core'
import { catalogGroups, itemData, loadBandRiders, memberData } from '@/lib/riders'
import { getSession } from '@/lib/session'

type Props = {
  params: Promise<{ locale: Locale; id: string }>
  searchParams: Promise<{ config?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'rider' })
  return { title: t('title') }
}

export default async function RiderEditorPage({ params, searchParams }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const session = await getSession()
  if (!session) return redirect({ href: '/connexion', locale })
  const band = await getBandForEdit(id, session.user.id)
  if (!band) notFound()
  const t = await getTranslations('rider')

  const { riders, members, customs, defs } = await loadBandRiders(band.id)
  const { config } = await searchParams
  const current = riders.find((r) => r.id === config) ?? riders[0]
  const userIds = members.map((m) => m.userId).filter((x): x is string => Boolean(x))
  const gearOwners = new Set(
    userIds.length
      ? (
          await db
            .select({ u: musicianGear.userId })
            .from(musicianGear)
            .where(inArray(musicianGear.userId, userIds))
        ).map((g) => g.u)
      : [],
  )
  const groups = [...catalogGroups(), { id: 'custom', keys: customs.map((c) => `custom:${c.id}`) }]
  const mData = members.map(memberData)

  const header = (
    <div>
      <Link href={{ pathname: '/compte/groupe/[id]', params: { id: band.id } }} className="label">
        ← {band.name}
      </Link>
      <h1 className={`display ${styles.title}`} style={{ marginTop: 10 }}>
        {t('title')}
      </h1>
      <p className={styles.intro}>{t('intro')}</p>
    </div>
  )

  if (!current)
    return (
      <section className={styles.page}>
        <div className={`container ${styles.wrap}`}>
          {header}
          <div className={styles.panel}>
            <h2 className={styles.h2}>{t('empty.title')}</h2>
            <p className={styles.muted}>{t('empty.text')}</p>
          </div>
          <NewConfigForm bandId={band.id} riders={[]} first />
        </div>
      </section>
    )

  const items = current.items.map(itemData)
  const stats = riderStats(items, defs)
  const mixes = monitorMixes(items, defs, mData)
  const auto = defaultPlot(items, defs, mData, {
    riser: t('plot.riser'),
    amp: t('plot.amp'),
    wedge: t('plot.wedge'),
    power: t('plot.power'),
  })

  return (
    <section className={styles.page}>
      <div className={`container ${styles.wrap}`}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
          }}
        >
          {header}
          <div className={styles.toolbar}>
            {band.slug && (
              <Link
                href={{
                  pathname: '/groupes/[slug]/fiche-technique',
                  params: { slug: band.slug },
                  query: { config: current.id },
                }}
                className="btn btn--ghost"
              >
                {t('view')}
              </Link>
            )}
            <a href={`/api/fiche/${current.id}/pdf?lang=${locale}`} className="btn btn--red">
              {t('pdf')}
            </a>
          </div>
        </div>

        <nav className={styles.tabs} aria-label={t('configs.label')}>
          {riders.map((r) => {
            const n = patchRows(r.items.map(itemData), defs, mData).length
            return (
              <Link
                key={r.id}
                href={{
                  pathname: '/compte/groupe/[id]/fiche-technique',
                  params: { id: band.id },
                  query: { config: r.id },
                }}
                className={styles.tab}
                aria-current={r.id === current.id ? 'page' : undefined}
              >
                {r.name}{' '}
                <span className={styles.tabMeta}>· {t('configs.inputs', { count: n })}</span>
              </Link>
            )
          })}
        </nav>
        <div className={styles.toolbar} style={{ justifyContent: 'space-between' }}>
          <ConfigActions riderId={current.id} name={current.name} />
        </div>
        <NewConfigForm bandId={band.id} riders={riders.map((r) => ({ id: r.id, name: r.name }))} />

        <div className={styles.stats}>
          <span>
            <span className={styles.statValue}>{stats.inputs}</span>
            {t('stats.inputs')}
          </span>
          <span>
            <span className={styles.statValue}>{stats.mixes}</span>
            {t('stats.mixes')}
          </span>
          <span>
            <span className={styles.statValue}>{stats.power}</span>
            {t('stats.power')}
          </span>
          <span>
            <span className={`${styles.statValue} ${styles.statAmber}`}>{stats.venue}</span>
            {t('stats.venue')}
          </span>
          {current.people !== null && (
            <span>
              <span className={styles.statValue} style={{ color: 'var(--c-text)' }}>
                {current.people}
              </span>
              {t('stats.people')}
            </span>
          )}
        </div>

        <MembersCatalog
          riderId={current.id}
          members={members.map((m) => ({
            id: m.id,
            name: m.name,
            role: m.role,
            hasGear: Boolean(m.userId && gearOwners.has(m.userId)),
          }))}
          items={items}
          defs={defs}
          groups={groups}
        />

        <section className={styles.panel} aria-labelledby="patch">
          <div className={styles.headRow}>
            <h2 id="patch" className={styles.h2}>
              {t('patch.title')}
            </h2>
            <span className={styles.faint}>{t('patch.hint')}</span>
          </div>
          <PatchList
            riderId={current.id}
            items={items}
            defs={defs}
            members={mData}
            order={current.patchOrder}
            editable
          />
        </section>

        <section className={styles.panel} aria-labelledby="plot">
          <h2 id="plot" className={styles.h2}>
            {t('plot.title')}
          </h2>
          <PlotEditor key={current.id} riderId={current.id} initial={current.plot} auto={auto} />
        </section>

        <section className={styles.panel} aria-labelledby="monitors">
          <h2 id="monitors" className={styles.h2}>
            {t('monitorsSection.title')}
          </h2>
          <MonitorsForm
            key={current.id}
            riderId={current.id}
            mixes={mixes}
            notes={current.monitorNotes}
            iemNote={current.iemNote}
          />
        </section>

        <RiderInfoForm
          key={current.id}
          riderId={current.id}
          info={{
            engineer: current.engineer,
            setupMinutes: current.setupMinutes,
            soundcheckMinutes: current.soundcheckMinutes,
            changeoverMinutes: current.changeoverMinutes,
            minStage: current.minStage,
            people: current.people,
            meals: current.meals,
            greenRoom: current.greenRoom,
            drinks: current.drinks,
            parking: current.parking,
            lodging: current.lodging,
          }}
        />
      </div>
    </section>
  )
}
