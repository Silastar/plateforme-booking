import { inArray, sql } from 'drizzle-orm'
import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { MapView, type MapPoint } from '@/components/search/MapView'
import styles from '@/components/search/search.module.css'
import { db } from '@/db'
import { rider } from '@/db/schema'
import { getPathname, Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { GENRES, type Genre } from '@/lib/genres'
import { hasPoint, type Point } from '@/lib/geo'
import { geocode } from '@/lib/geocode'
import { getOrgaForEdit } from '@/lib/orgas'
import { cleanGenres, RADII, searchBands, SORTS, type Sort } from '@/lib/search'
import { getSession } from '@/lib/session'

type Search = Record<string, string | string[] | undefined>
type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<Search> }

// Initiales sans les articles : « Les Néons Fauves » → NF.
const ARTICLES = new Set(['le', 'la', 'les', 'l', 'the', 'a', 'des', 'du', 'de'])
const initials = (name: string) => {
  const words = name.split(/[\s'’-]+/).filter(Boolean)
  const main = words.filter((w) => !ARTICLES.has(w.toLowerCase()))
  return (main.length ? main : words)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
const int = (v: string) => (/^\d{1,7}$/.test(v) ? Number(v) : null)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'search.bands' })
  return { title: t('metaTitle'), description: t('intro') }
}

export default async function BandSearchPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const sp = await searchParams
  const t = await getTranslations('search')
  const tg = await getTranslations('genres')
  const format = await getFormatter()
  const session = await getSession()
  const role = session?.user.role ?? null
  const orga = role === 'orga' ? await getOrgaForEdit(session!.user.id) : null
  const canSeeFee = role === 'orga' || role === 'admin'

  // Lieu : un des lieux de l'orga, sinon une ville saisie (l'accueil envoie « lieu » en texte libre).
  const lieu = one(sp.lieu)
  const venue =
    orga?.venues.find((v) => v.id === lieu) ??
    (!lieu && !one(sp.ville) ? orga?.venues[0] : undefined)
  const city = venue
    ? ''
    : one(sp.ville) ||
      (orga?.venues.some((v) => v.id === lieu) ? '' : lieu) ||
      (orga && !orga.venues.length ? orga.city : '')
  let point: Point | null = venue && hasPoint(venue) ? venue : null
  let cityMissing = false
  if (!venue && city) {
    point = await geocode(city)
    cityMissing = !point
  }
  const placeLabel = venue ? `${venue.name}, ${venue.city}` : city

  const genres = cleanGenres(sp.g ?? sp.genre)
  const day = /^\d{4}-\d{2}-\d{2}$/.test(one(sp.date)) ? one(sp.date) : null
  const sort = (
    (SORTS as readonly string[]).includes(one(sp.tri)) ? one(sp.tri) : 'relevance'
  ) as Sort
  const maxKm = int(one(sp.rayon))
  const query = {
    genres,
    point,
    maxKm: point ? maxKm : null,
    day,
    freeOnly: Boolean(day) && one(sp.libre) === '1',
    budgetMin: canSeeFee ? int(one(sp.min)) : null,
    budgetMax: canSeeFee ? int(one(sp.max)) : null,
    gear: one(sp.matos) === '1' && venue ? venue.gear : null,
    sort,
  }
  const results = await searchBands(query)
  const riderBands = new Set(
    results.length
      ? (
          await db
            .select({ id: rider.bandId, n: sql<number>`count(*)` })
            .from(rider)
            .where(
              inArray(
                rider.bandId,
                results.map((r) => r.band.id),
              ),
            )
            .groupBy(rider.bandId)
        ).map((r) => r.id)
      : [],
  )

  const isMap = one(sp.vue) === 'carte'
  const base = getPathname({ locale, href: '/groupes' })
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
  const dayLabel = day
    ? format.dateTime(new Date(`${day}T12:00:00Z`), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      })
    : ''
  const chf = (n: number) =>
    format.number(n, { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 })
  const fee = (min: number | null, max: number | null) =>
    min === null && max === null
      ? t('bands.feeOpen')
      : min !== null && max !== null && min !== max
        ? new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: 'CHF',
            maximumFractionDigits: 0,
          }).formatRange(min, max)
        : chf((min ?? max)!)
  const points: MapPoint[] = results
    .filter((r) => hasPoint(r.band))
    .map((r) => ({
      id: r.band.id,
      lat: r.band.lat!,
      lng: r.band.lng!,
      label: r.band.name,
      sub: [
        r.band.city,
        r.distance !== null ? t('bands.distance', { km: Math.round(r.distance) }) : null,
      ]
        .filter(Boolean)
        .join(' · '),
      href: getPathname({
        locale,
        href: { pathname: '/groupes/[slug]', params: { slug: r.band.slug! } },
      }),
      kind: 'band',
    }))

  return (
    <section className={styles.page} style={{ ['--accent' as string]: 'var(--c-amber)' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 className={`display ${styles.title}`}>{t('bands.title')}</h1>
          <p className={styles.intro}>
            {day && placeLabel
              ? t('bands.forDate', { date: dayLabel, place: placeLabel })
              : t('bands.intro')}
          </p>
        </div>
        <div className={styles.layout}>
          <form
            id="filtres"
            method="get"
            action={base}
            className={styles.filters}
            aria-label={t('filters.title')}
          >
            <fieldset style={{ border: 0, padding: 0, margin: 0 }} className={styles.field}>
              <legend style={{ padding: 0, marginBottom: 8 }}>{t('filters.genre')}</legend>
              <div className={styles.chips}>
                {GENRES.map((g) => (
                  <label key={g} className={styles.chip}>
                    <input type="checkbox" name="g" value={g} defaultChecked={genres.includes(g)} />
                    <span>{tg(g)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {orga && orga.venues.length > 0 ? (
              <label className={styles.field}>
                {t('filters.place')}
                <select name="lieu" defaultValue={venue?.id ?? ''}>
                  {orga.venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}, {v.city}
                    </option>
                  ))}
                  <option value="">{t('filters.otherCity')}</option>
                </select>
              </label>
            ) : null}
            <label className={styles.field}>
              {orga && orga.venues.length > 0 ? t('filters.city') : t('filters.place')}
              <input
                name="ville"
                defaultValue={venue ? '' : city}
                placeholder={t('filters.cityPlaceholder')}
                autoComplete="address-level2"
              />
              <span className={styles.help}>{t('filters.placeHelp')}</span>
              {cityMissing && (
                <span className={styles.help} style={{ color: 'var(--c-red-text)' }}>
                  {t('filters.cityNotFound', { city })}
                </span>
              )}
            </label>
            <label className={styles.field}>
              {t('filters.maxKm')}
              <select name="rayon" defaultValue={maxKm ? String(maxKm) : ''}>
                <option value="">{t('filters.anyKm')}</option>
                {RADII.map((r) => (
                  <option key={r} value={r}>
                    {t('filters.km', { km: r })}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              {t('filters.date')}
              <input type="date" name="date" defaultValue={day ?? ''} />
            </label>
            <label className={styles.check}>
              <input
                type="checkbox"
                name="libre"
                value="1"
                defaultChecked={one(sp.libre) === '1'}
              />
              {t('filters.freeOnly')}
            </label>
            {canSeeFee && (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }} className={styles.field}>
                <legend style={{ padding: 0, marginBottom: 8 }}>{t('filters.budget')}</legend>
                <div className={styles.grid2}>
                  <input
                    type="number"
                    name="min"
                    min={0}
                    aria-label={t('filters.min')}
                    placeholder={t('filters.min')}
                    defaultValue={one(sp.min)}
                  />
                  <input
                    type="number"
                    name="max"
                    min={0}
                    aria-label={t('filters.max')}
                    placeholder={t('filters.max')}
                    defaultValue={one(sp.max)}
                  />
                </div>
              </fieldset>
            )}
            {orga && orga.venues.length > 0 && (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  name="matos"
                  value="1"
                  defaultChecked={one(sp.matos) === '1'}
                />
                <span>
                  {t('filters.gear')}
                  <br />
                  <span className={styles.help}>{t('filters.gearHelp')}</span>
                </span>
              </label>
            )}
            <label className={styles.field}>
              {t('filters.sort')}
              <select name="tri" defaultValue={sort}>
                {SORTS.map((s) => (
                  <option key={s} value={s}>
                    {t(`filters.sorts.${s}`)}
                  </option>
                ))}
              </select>
            </label>
            {isMap && <input type="hidden" name="vue" value="carte" />}
            <button type="submit" className="btn btn--amber">
              {t('filters.submit')}
            </button>
            <a href={base} className={styles.help} style={{ color: 'var(--c-muted)' }}>
              {t('filters.reset')}
            </a>
          </form>

          <div className={styles.results}>
            <div className={styles.bar}>
              <p className={styles.count} role="status">
                <strong>{t('bands.count', { count: results.length })}</strong>
              </p>
              <a href="#filtres" className={styles.toFilters}>
                {t('filters.title')} ↓
              </a>
              <nav className={styles.toggle} aria-label={t('view.label')}>
                <a href={qs({ vue: '' })} aria-current={!isMap ? 'page' : undefined}>
                  {t('view.list')}
                </a>
                <a href={qs({ vue: 'carte' })} aria-current={isMap ? 'page' : undefined}>
                  {t('view.map')}
                </a>
              </nav>
            </div>
            {results.length === 0 && <p className={styles.empty}>{t('bands.empty')}</p>}
            {isMap ? (
              <MapView
                points={points}
                center={point}
                radiusKm={maxKm}
                centerLabel={placeLabel || t('map.center')}
                linkLabel={t('map.link')}
              />
            ) : (
              results.map(({ band: b, distance, travels, free, gear }) => {
                const gs = [b.mainGenre, ...b.genres.filter((g) => g !== b.mainGenre)].slice(
                  0,
                  3,
                ) as Genre[]
                return (
                  <article key={b.id} className={styles.card}>
                    <div className={styles.photo} aria-hidden="true">
                      {b.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.photo} alt="" />
                      ) : (
                        initials(b.name)
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.cardHead}>
                        <Link
                          href={{ pathname: '/groupes/[slug]', params: { slug: b.slug! } }}
                          className={styles.name}
                        >
                          {b.name}
                        </Link>
                        <span className={styles.badges}>
                          {free === true && (
                            <span className={`${styles.badge} ${styles.badgeAmber}`}>
                              {t('bands.free', { date: dayLabel })}
                            </span>
                          )}
                          {free === false && (
                            <span className={`${styles.badge} ${styles.badgeRed}`}>
                              {t('bands.busy', { date: dayLabel })}
                            </span>
                          )}
                          {gear && (
                            <span className={styles.badge}>
                              {t('bands.gear', { ok: gear.ok, total: gear.total })}
                            </span>
                          )}
                          {point && travels === null && (
                            <span className={styles.badge}>{t('bands.zoneUnknown')}</span>
                          )}
                        </span>
                      </div>
                      <span className={styles.badges}>
                        {gs.map((g) => (
                          <span key={g} className={styles.badge}>
                            {tg(g)}
                          </span>
                        ))}
                      </span>
                      <span className={styles.meta}>
                        {[
                          b.city,
                          distance !== null
                            ? t('bands.distance', { km: Math.round(distance) })
                            : null,
                          b.musiciansCount
                            ? t('bands.musicians', { count: b.musiciansCount })
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      <div className={styles.cardFoot}>
                        <span className={styles.fee}>
                          <span className="label" style={{ color: 'var(--c-faint)' }}>
                            {t('bands.fee')}
                          </span>
                          <strong>
                            {canSeeFee ? fee(b.feeMin, b.feeMax) : t('bands.feeLocked')}
                          </strong>
                        </span>
                        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {session && riderBands.has(b.id) && (
                            <Link
                              href={{
                                pathname: '/groupes/[slug]/fiche-technique',
                                params: { slug: b.slug! },
                                query: venue ? { lieu: venue.id } : {},
                              }}
                              className="btn btn--ghost"
                            >
                              {t('bands.rider')}
                            </Link>
                          )}
                          <Link
                            href={{ pathname: '/groupes/[slug]', params: { slug: b.slug! } }}
                            className="btn btn--amber"
                          >
                            {t('bands.profile')}
                          </Link>
                        </span>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
