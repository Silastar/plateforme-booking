'use client'

import 'leaflet/dist/leaflet.css'

import { useEffect, useRef } from 'react'

import styles from './search.module.css'

export type MapPoint = {
  id: string
  lat: number
  lng: number
  label: string
  sub?: string
  href?: string
  kind: 'band' | 'gig'
}

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )

// Carte sombre (tuiles OpenStreetMap inversées) : résultats, point de référence et rayon de recherche.
export function MapView({
  points,
  center,
  radiusKm,
  centerLabel,
  linkLabel,
}: {
  points: MapPoint[]
  center: { lat: number; lng: number } | null
  radiusKm: number | null
  centerLabel: string
  linkLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import('leaflet').Map | null = null
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return
      map = L.map(ref.current, { scrollWheelZoom: false })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: styles.tiles,
      }).addTo(map)

      // Plusieurs résultats dans la même ville : on les écarte un peu en cercle.
      const seen = new Map<string, number>()
      const bounds: [number, number][] = []
      for (const p of points) {
        const key = `${p.lat.toFixed(3)}:${p.lng.toFixed(3)}`
        const n = seen.get(key) ?? 0
        seen.set(key, n + 1)
        const angle = n * 2.4
        const lat = p.lat + (n ? Math.cos(angle) * 0.012 * Math.sqrt(n) : 0)
        const lng = p.lng + (n ? Math.sin(angle) * 0.018 * Math.sqrt(n) : 0)
        const icon = L.divIcon({
          className: '',
          html: `<span class="${p.kind === 'band' ? styles.pinBand : styles.pinGig}"></span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })
        L.marker([lat, lng], { icon, title: p.label, keyboard: true })
          .addTo(map)
          .bindPopup(
            `<strong>${escape(p.label)}</strong>${p.sub ? `<br>${escape(p.sub)}` : ''}${
              p.href ? `<br><a href="${escape(p.href)}">${escape(linkLabel)} →</a>` : ''
            }`,
          )
        bounds.push([lat, lng])
      }
      if (center) {
        L.marker([center.lat, center.lng], {
          icon: L.divIcon({
            className: '',
            html: `<span class="${styles.pinCenter}"></span>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          title: centerLabel,
        })
          .addTo(map)
          .bindPopup(escape(centerLabel))
        bounds.push([center.lat, center.lng])
        if (radiusKm) {
          const circle = L.circle([center.lat, center.lng], {
            radius: radiusKm * 1000,
            color: '#f5b82e',
            weight: 2,
            fillOpacity: 0.05,
            dashArray: '6 6',
          }).addTo(map)
          bounds.push(
            ...([circle.getBounds().getNorthWest(), circle.getBounds().getSouthEast()].map((b) => [
              b.lat,
              b.lng,
            ]) as [number, number][]),
          )
        }
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 })
      else if (bounds.length === 1) map.setView(bounds[0], 10)
      else map.setView([46.8, 7.1], 8)
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [points, center, radiusKm, centerLabel, linkLabel])

  return <div ref={ref} className={styles.map} role="region" aria-label={centerLabel} />
}
