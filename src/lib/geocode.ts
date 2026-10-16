import 'server-only'
import { and, eq, isNotNull, isNull, ne } from 'drizzle-orm'

import { db } from '@/db'
import { band, geocodeCache, musician, organization, venue } from '@/db/schema'

import { geoKey, type Point } from './geo'

// Géocodage par Nominatim (OpenStreetMap) : une requête par seconde au plus, réponses gardées en cache.
// Seules des villes et adresses de lieux sont envoyées, jamais de données personnelles.
const ENDPOINT = process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org/search'
const COUNTRIES = process.env.GEO_COUNTRIES ?? 'ch,fr,be,lu'
const USER_AGENT = 'plateforme-booking/0.1 (geocoding of city names)'

let queue: Promise<unknown> = Promise.resolve()
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchNominatim(q: string): Promise<(Point & { label: string }) | null> {
  const params = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: COUNTRIES })
  // Un simple nom de ville : on veut la localité, pas le canton ou le département du même nom.
  if (!/[,\d]/.test(q)) params.set('featureType', 'city')
  const url = `${ENDPOINT}?${params}`
  const res = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, 'accept-language': 'fr,en' },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`nominatim ${res.status}`)
  const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[]
  if (!rows.length) return null
  return { lat: Number(rows[0].lat), lng: Number(rows[0].lon), label: rows[0].display_name }
}

export async function geocode(query: string): Promise<Point | null> {
  const key = geoKey(query)
  if (!key) return null
  const cached = await db.query.geocodeCache.findFirst({ where: eq(geocodeCache.query, key) })
  if (cached)
    return cached.lat !== null && cached.lng !== null ? { lat: cached.lat, lng: cached.lng } : null
  const run = queue.then(async () => {
    try {
      return await fetchNominatim(key)
    } finally {
      await wait(1100)
    }
  })
  queue = run.catch(() => null)
  try {
    const hit = await run
    await db
      .insert(geocodeCache)
      .values({
        query: key,
        lat: hit?.lat ?? null,
        lng: hit?.lng ?? null,
        label: hit?.label ?? null,
      })
      .onConflictDoNothing()
    return hit ? { lat: hit.lat, lng: hit.lng } : null
  } catch (e) {
    // Réseau ou service indisponible : on réessaiera au prochain enregistrement ou démarrage.
    console.warn('[geo]', (e as Error).message)
    return null
  }
}

export async function locateBand(id: string) {
  const b = await db.query.band.findFirst({ where: eq(band.id, id) })
  if (!b) return
  const p = await geocode(b.city)
  await db
    .update(band)
    .set({ lat: p?.lat ?? null, lng: p?.lng ?? null })
    .where(eq(band.id, id))
}

export async function locateOrga(id: string) {
  const o = await db.query.organization.findFirst({ where: eq(organization.id, id) })
  if (!o) return
  const p = await geocode(o.city)
  await db
    .update(organization)
    .set({ lat: p?.lat ?? null, lng: p?.lng ?? null })
    .where(eq(organization.id, id))
}

// Un lieu : son adresse précise si elle est connue, sinon sa ville.
export async function locateVenue(id: string) {
  const v = await db.query.venue.findFirst({ where: eq(venue.id, id) })
  if (!v) return
  const full = [v.address, [v.postalCode, v.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  const p = (v.address ? await geocode(full) : null) ?? (await geocode(v.city))
  await db
    .update(venue)
    .set({ lat: p?.lat ?? null, lng: p?.lng ?? null })
    .where(eq(venue.id, id))
}

export async function locateMusician(userId: string) {
  const m = await db.query.musician.findFirst({ where: eq(musician.userId, userId) })
  if (!m) return
  const p = await geocode(m.city)
  await db
    .update(musician)
    .set({ lat: p?.lat ?? null, lng: p?.lng ?? null })
    .where(eq(musician.userId, userId))
}

// Au démarrage : place les profils pas encore géolocalisés (au plus 200 par passage).
export async function backfillGeo() {
  const notLocated = (t: typeof band | typeof organization | typeof musician | typeof venue) =>
    and(isNull(t.lat), isNotNull(t.city), ne(t.city, ''))
  const [bands, orgas, venues, musicians] = await Promise.all([
    db.select({ id: band.id }).from(band).where(notLocated(band)).limit(200),
    db
      .select({ id: organization.id })
      .from(organization)
      .where(notLocated(organization))
      .limit(200),
    db.select({ id: venue.id }).from(venue).where(notLocated(venue)).limit(200),
    db.select({ id: musician.userId }).from(musician).where(notLocated(musician)).limit(200),
  ])
  for (const b of bands) await locateBand(b.id)
  for (const o of orgas) await locateOrga(o.id)
  for (const v of venues) await locateVenue(v.id)
  for (const m of musicians) await locateMusician(m.id)
  const n = bands.length + orgas.length + venues.length + musicians.length
  if (n) console.info(`[geo] ${n} profils géolocalisés`)
}
