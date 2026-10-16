import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'

import { db } from '@/db'
import { band, rider } from '@/db/schema'
import { getOrgaForEdit } from '@/lib/orgas'
import { MIC_TOKENS } from '@/lib/rider-catalog'
import {
  compareWithVenue,
  defaultPlot,
  monitorMixes,
  patchRows,
  riderStats,
  type Check,
} from '@/lib/rider-core'
import { riderPdf } from '@/lib/rider-pdf'
import { itemData, loadBandRiders, memberData } from '@/lib/riders'
import { getSession } from '@/lib/session'

// PDF d'une configuration de fiche technique, pour les comptes connectés (comme la page de la fiche).
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  const { id } = await params
  const url = new URL(req.url)
  const locale = url.searchParams.get('lang') === 'en' ? 'en' : 'fr'
  const r = await db.query.rider.findFirst({ where: eq(rider.id, id) })
  if (!r) return new Response('Not found', { status: 404 })
  const b = await db.query.band.findFirst({ where: eq(band.id, r.bandId) })
  if (!b) return new Response('Not found', { status: 404 })

  const t = await getTranslations({ locale, namespace: 'rider' })
  const tk = t as unknown as (key: string, values: Record<string, string | number>) => string
  const site = (await getTranslations({ locale, namespace: 'meta' }))('siteName')
  const { riders, members, defs } = await loadBandRiders(b.id)
  const current = riders.find((x) => x.id === r.id)!
  const mData = members.map(memberData)
  const items = current.items.map(itemData)
  const stats = riderStats(items, defs)
  const mic = (m: string) =>
    (MIC_TOKENS as readonly string[]).includes(m) ? t(`mics.${m}` as never) : m || '-'
  const rows = patchRows(items, defs, mData, current.patchOrder).map((row) => ({
    ...row,
    micLabel: mic(row.mic),
    standLabel: t(`stands.${row.stand}` as never),
  }))
  const seen = new Set<string>()
  const mixes = monitorMixes(items, defs, mData).map((m, i) => {
    const key = m.memberId ?? 'common'
    const note = !seen.has(key) ? current.monitorNotes[key] : undefined
    seen.add(key)
    return {
      ...m,
      kindLabel: t(`monitors.${m.kind}` as never),
      note,
      title: `${t('monitorsSection.mix', { n: i + 1 })} · ${m.memberName || t('members.common')}`,
    }
  })
  const plot = current.plot.length
    ? current.plot
    : defaultPlot(items, defs, mData, {
        riser: t('plot.riser'),
        amp: t('plot.amp'),
        wedge: t('plot.wedge'),
        power: t('plot.power'),
      })
  const minutes = (n: number | null) => (n !== null ? t('general.minutes', { n }) : null)
  const strip = (s: string) => s.replace(/ \(.*\)/, '')

  // Comparaison avec un lieu de l'orga connectée, si demandé.
  let match = null
  const lieu = url.searchParams.get('lieu')
  if (lieu && session.user.role === 'orga') {
    const orga = await getOrgaForEdit(session.user.id)
    const venue = orga?.venues.find((v) => v.id === lieu)
    if (venue) {
      const res = compareWithVenue(items, defs, venue.gear)
      const status = (c: Check) =>
        c.status === 'sub'
          ? t('match.sub')
          : c.status === 'unknown'
            ? t('match.unknownStatus')
            : c.have !== undefined
              ? t(c.status === 'ok' ? 'match.okCount' : 'match.missingCount', { have: c.have })
              : t(c.status === 'ok' ? 'match.ok' : 'match.missing')
      match = {
        title: `${venue.name} · ${res.known ? t('match.title', { ok: res.ok, total: res.total }) : t('match.unknownTitle')}`,
        lines: res.checks.map((c) => ({
          text: tk(`match.${c.kind}`, { need: c.need, model: c.model ?? '' }),
          status: c.status,
          statusText: status(c),
        })),
      }
    }
  }

  const pdf = await riderPdf({
    site,
    bandName: b.name,
    configName: current.name,
    statsLine: `${stats.inputs} ${t('stats.inputs')} · ${stats.mixes} ${t('stats.mixes')} · ${stats.power} ${t('stats.power')}`,
    labels: {
      rider: t('title'),
      patch: t('patch.title'),
      cols: ['#', t('patch.source'), t('patch.mic'), t('patch.stand'), t('patch.member')],
      plot: t('plot.title'),
      audience: t('plot.audience'),
      monitors: t('monitorsSection.title'),
      hosp: t('hosp.title'),
      general: t('general.title'),
      bring: t('public.bring'),
      match: t('match.pickVenue'),
      generated: t('pdfGenerated', {
        date: new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr', {
          dateStyle: 'long',
          timeZone: 'Europe/Zurich',
        }).format(new Date()),
      }),
    },
    rows,
    plot,
    mixes,
    iemNote: current.iemNote,
    hosp: (
      [
        [t('hosp.people'), current.people !== null ? String(current.people) : null],
        [t('hosp.meals'), current.meals],
        [t('hosp.greenRoom'), current.greenRoom],
        [t('hosp.drinks'), current.drinks],
        [t('hosp.parking'), current.parking],
        [t('hosp.lodging'), current.lodging],
      ] as [string, string | null][]
    ).filter((x): x is [string, string] => Boolean(x[1])),
    general: (
      [
        [t('general.engineer'), current.engineer || t('general.venueEngineer')],
        [strip(t('general.setup')), minutes(current.setupMinutes)],
        [strip(t('general.soundcheck')), minutes(current.soundcheckMinutes)],
        [strip(t('general.changeover')), minutes(current.changeoverMinutes)],
        [t('general.minStage'), current.minStage],
      ] as [string, string | null][]
    ).filter((x): x is [string, string] => Boolean(x[1])),
    bring: items
      .filter((i) => i.provider === 'band' && defs[i.objectKey])
      .map((i) => {
        const who = mData.find((m) => m.id === i.memberId)?.name.split(' ')[0]
        return `${defs[i.objectKey].name}${i.qty > 1 ? ` ×${i.qty}` : ''}${who ? ` (${who})` : ''}`
      }),
    match,
  })
  const file = `${b.slug ?? 'groupe'}-${current.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${file}.pdf"`,
      'cache-control': 'private, no-store',
    },
  })
}
