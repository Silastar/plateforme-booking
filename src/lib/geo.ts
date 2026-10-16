// Distances à vol d'oiseau, sans dépendance ni base.

export type Point = { lat: number; lng: number }

export const hasPoint = (
  p: { lat: number | null; lng: number | null } | null | undefined,
): p is Point => Boolean(p) && typeof p!.lat === 'number' && typeof p!.lng === 'number'

// Formule de haversine, rayon terrestre moyen 6371 km.
export function distanceKm(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)))
}

// Un groupe se déplace jusqu'à un lieu si celui-ci est dans son rayon.
// null : on ne sait pas (coordonnées ou rayon manquants).
export function reaches(
  band: { lat: number | null; lng: number | null; radiusKm: number | null },
  place: { lat: number | null; lng: number | null } | null,
) {
  if (!hasPoint(band) || !hasPoint(place) || band.radiusKm === null) return null
  return distanceKm(band, place) <= band.radiusKm
}

// Clé de cache d'une adresse : minuscules, espaces simplifiés.
export const geoKey = (q: string) =>
  q
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim()
