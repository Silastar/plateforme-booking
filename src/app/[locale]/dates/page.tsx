import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import styles from '@/components/gigs/gigs.module.css'
import { GigTicket, toTicket } from '@/components/gigs/GigTicket'
import { MapView, type MapPoint } from '@/components/search/MapView'
import search from '@/components/search/search.module.css'
import { getPathname } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getAdminBands } from '@/lib/bands'
import { todayIso } from '@/lib/calendar'
import { GENRES } from '@/lib/genres'
import { hasPoint, type Point } from '@/lib/geo'
import { geocode } from '@/lib/geocode'
import { getBandApplications, gigPoint } from '@/lib/gigs'
import { cleanGenres, RADII, searchGigs } from '@/lib/search'
import { getSession } from '@/lib/session'

type Search = Record<string, string | string[] | undefined>
type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Search> }

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const int = (v: string) => (/^\d{1,7}$/.test(v) ? Number(v) : null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gigs.list' })
  return { title: t('title'), description: t('introVisitor') }
}

export default async function OpenDatesPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams
  const t = await getTranslations('gigs')
  const ts = await getTranslations('search')
  const tg = await getTranslations('genres')
  const format = await getFormatter()
  const session = await getSession()
  const bands = session ? await getAdminBands(session.user.id) : []
  const myBand = bands[0]

  // Zone : la ville saisie, sinon celle du groupe avec son rayon.
  const touched = Object.keys(sp).length > 0
  const city = touched ? one(sp.ville) : (myBand?.city ?? '')
  let point: Point | null = null
  let cityMissing = false
  if (city) {
    point = !touched && myBand && hasPoint(myBand) ? myBand : await geocode(city)
    cityMissing = !point
  }
  const maxKm = touched ? int(one(sp.rayon)) : (myBand?.radiusKm ?? null)
  const month = /^\d{4}-\d{2}$/.test(one(sp.mois)) ? one(sp.mois) : null
  const genres = cleanGenres(sp.g)
  const rows = await searchGigs(
    {
      genres,
      month,
      point,
      maxKm: point ? maxKm : null,
      budgetMin: session ? int(one(sp.min)) : null,
      fitsOnly: one(sp.colle) === '1',
    },
    bands,
  )
  const applied = new Set(
    (await getBandApplications(bands.map((b) => b.id)))
      .filter((a) => a.status === 'pending')
      .map((a) => a.gigId),
  )
  const fitsCount = rows.filter((r) => r.match?.fits).length

  const today = todayIso()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(`${today.slice(0, 7)}-01T12:00:00Z`)
    d.setUTCMonth(d.getUTCMonth() + i)
    return d.toISOString().slice(0, 7)
  })
  const monthLabel = (m: string) =>
    format.dateTime(new Date(`${m}-15T12:00:00Z`), {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

  const isMap = one(sp.vue) === 'carte'
  const base = getPathname({ locale, href: '/dates' })
  const qs = (override: Record<string, string>) => {
    const u = new URLSearchParams()
    for (const [k, v] of Object.entries(sp))
      for (const x of Array.isArray(v) ? v : v ? [v] : []) u.append(k, x)
    for (const [k, v] of Object.entries(override)) {
      u.delete(k)
      if (v) u.set(k, v)
    }
    const s = u.toString()
    return s ? `${base}?${s}` : base
  }
  const points: MapPoint[] = rows.flatMap(({ gig: g }) => {
    const p = gigPoint(g)
    if (!hasPoint(p)) return []
    return [
      {
        id: g.id,
        lat: p.lat,
        lng: p.lng,
        label: `${format.dateTime(new Date(`${g.day}T12:00:00Z`), { day: 'numeric', month: 'long', timeZone: 'UTC' })} · ${g.organization.name}`,
        sub: g.venue?.city ?? g.organization.city,
        href: getPathname({ locale, href: { pathname: '/dates/[id]', params: { id: g.id } } }),
        kind: 'gig' as const,
      },
    ]
  })

  return (
    <section
      className={styles.page}
      style={{
        ['--accent' as string]: 'var(--c-red)',
        ['--accent-text' as string]: 'var(--c-red-text)',
      }}
    >
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h1 className={`display ${styles.pageTitle}`}>{t('list.title')}</h1>
          <p className={styles.intro}>{session ? t('list.intro') : t('list.introVisitor')}</p>
          {fitsCount > 0 && (
            <p className={styles.intro} style={{ color: 'var(--c-amber)', fontWeight: 800 }}>
              {t('list.fitsCount', { count: fitsCount })}
            </p>
          )}
        </div>
        <div className={search.layout}>
          <form
            id="filtres"
            method="get"
            action={base}
            className={search.filters}
            aria-label={ts('filters.title')}
          >
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className={search.field}>
              <legend style={{ padding: 0, marginBottom: 8 }}>{ts('filters.genre')}</legend>
              <div className={search.chips}>
                {GENRES.map((g) => (
                  <label key={g} className={search.chip}>
                    <input type="checkbox" name="g" value={g} defaultChecked={genres.includes(g)} />
                    <span>{tg(g)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={search.field}>
              {ts('filters.month')}
              <select name="mois" defaultValue={month ?? ''}>
                <option value="">{ts('filters.anyMonth')}</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className={search.field}>
              {ts('filters.around')}
              <input
                name="ville"
                defaultValue={city}
                placeholder={ts('filters.cityPlaceholder')}
                autoComplete="address-level2"
              />
              {myBand && <span className={search.help}>{ts('filters.aroundHelp')}</span>}
              {cityMissing && (
                <span className={search.help} style={{ color: 'var(--c-red-text)' }}>
                  {ts('filters.cityNotFound', { city })}
                </span>
              )}
            </label>
            <label className={search.field}>
              {ts('filters.maxKm')}
              <select name="rayon" defaultValue={maxKm ? String(maxKm) : ''}>
                <option value="">{ts('filters.anyKm')}</option>
                {[
                  ...new Set([
                    ...RADII,
                    ...(maxKm && !(RADII as readonly number[]).includes(maxKm) ? [maxKm] : []),
                  ]),
                ]
                  .sort((a, b) => a - b)
                  .map((r) => (
                    <option key={r} value={r}>
                      {ts('filters.km', { km: r })}
                    </option>
                  ))}
              </select>
            </label>
            {session && (
              <label className={search.field}>
                {ts('filters.budgetMin')}
                <input type="number" name="min" min={0} defaultValue={one(sp.min)} />
              </label>
            )}
            {bands.length > 0 && (
              <label className={search.check}>
                <input
                  type="checkbox"
                  name="colle"
                  value="1"
                  defaultChecked={one(sp.colle) === '1'}
                />
                {ts('filters.fitsOnly')}
              </label>
            )}
            {isMap && <input type="hidden" name="vue" value="carte" />}
            <button type="submit" className="btn btn--red">
              {ts('filters.submit')}
            </button>
            <a href={`${base}?ville=`} className={search.help} style={{ color: 'var(--c-muted)' }}>
              {ts('filters.reset')}
            </a>
          </form>

          <div className={search.results}>
            <div className={search.bar}>
              <p className={search.count} role="status">
                <strong>{ts('dates.count', { count: rows.length })}</strong>
              </p>
              <a href="#filtres" className={search.toFilters}>
                {ts('filters.title')} ↓
              </a>
              <nav className={search.toggle} aria-label={ts('view.label')}>
                <a href={qs({ vue: '' })} aria-current={!isMap ? 'page' : undefined}>
                  {ts('view.list')}
                </a>
                <a href={qs({ vue: 'carte' })} aria-current={isMap ? 'page' : undefined}>
                  {ts('view.map')}
                </a>
              </nav>
            </div>
            {rows.length === 0 && <p className={styles.empty}>{ts('dates.empty')}</p>}
            {isMap ? (
              <MapView
                points={points}
                center={point}
                radiusKm={maxKm}
                centerLabel={city || ts('map.center')}
                linkLabel={ts('map.link')}
              />
            ) : (
              <ul className={styles.tickets}>
                {rows.map(({ gig: g, match }) => (
                  <li key={g.id}>
                    <GigTicket
                      gig={toTicket(g)}
                      unlocked={Boolean(session)}
                      badge={
                        applied.has(g.id)
                          ? { label: t('ticket.applied'), muted: true }
                          : match?.fits
                            ? { label: t('ticket.fits') }
                            : undefined
                      }
                      link={!session ? 'login' : bands.length ? 'apply' : 'view'}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
