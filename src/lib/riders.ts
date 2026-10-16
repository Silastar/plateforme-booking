import 'server-only'
import { and, asc, eq, inArray, or } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'

import { db } from '@/db'
import { bandMember, customObject, rider, riderItem, type PlotItem } from '@/db/schema'

import { CATALOG, CATALOG_KEYS, RIDER_GROUPS, type Monitor, type Stand } from './rider-catalog'
import type { MemberData, ObjectDef, RiderItemData } from './rider-core'

type Custom = typeof customObject.$inferSelect

export function customDef(c: Custom): ObjectDef {
  return {
    key: `custom:${c.id}`,
    name: c.name,
    detail: '',
    icon: '✦',
    group: 'custom',
    inputs: c.inputs,
    mics: c.inputs.map(() => c.mic ?? ''),
    stands: c.inputs.map(() => (c.stand as Stand) ?? 'none'),
    monitor: (c.monitor as Monitor) || undefined,
    custom: true,
  }
}

// Catalogue traduit + objets perso, indexés par clé d'objet.
export async function objectDefs(customs: Custom[] = []): Promise<Record<string, ObjectDef>> {
  const t = await getTranslations('rider.objects')
  const defs: Record<string, ObjectDef> = {}
  for (const key of CATALOG_KEYS) {
    const c = CATALOG[key] as (typeof CATALOG)[typeof key] & {
      mics?: readonly string[]
      stands?: readonly Stand[]
      monitor?: Monitor
      venue?: ObjectDef['venue']
      plot?: ObjectDef['plot']
    }
    const inputs = t.raw(`${key}.inputs` as never) as string[]
    defs[key] = {
      key,
      name: t(`${key}.name` as never),
      detail: t(`${key}.detail` as never),
      icon: c.icon,
      group: c.group,
      inputs,
      mics: inputs.map((_, i) => c.mics?.[i] ?? c.mics?.[0] ?? ''),
      stands: inputs.map((_, i) => c.stands?.[i] ?? c.stands?.[0] ?? 'none'),
      monitor: c.monitor,
      venue: c.venue,
      plot: c.plot,
    }
  }
  for (const c of customs) defs[`custom:${c.id}`] = customDef(c)
  return defs
}

export const catalogGroups = () =>
  RIDER_GROUPS.map((g) => ({
    id: g,
    keys: CATALOG_KEYS.filter((k) => CATALOG[k].group === g) as string[],
  }))

// Membres actifs du line-up, dans l'ordre d'arrivée, avec leur instrument quand ils ont un profil.
export async function riderMembers(bandId: string) {
  const rows = await db.query.bandMember.findMany({
    where: and(eq(bandMember.bandId, bandId), eq(bandMember.status, 'active')),
    orderBy: [asc(bandMember.createdAt)],
    with: { user: { with: { musician: true } } },
  })
  return rows.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user?.musician?.stageName ?? m.name ?? m.user?.name ?? '—',
    role: m.role,
    instrument: m.user?.musician?.mainInstrument ?? null,
  }))
}

// Objets perso visibles dans les fiches d'un groupe : les siens et ceux de ses musiciens.
export async function bandCustoms(bandId: string, userIds: string[]) {
  return db
    .select()
    .from(customObject)
    .where(
      userIds.length
        ? or(eq(customObject.bandId, bandId), inArray(customObject.userId, userIds))
        : eq(customObject.bandId, bandId),
    )
    .orderBy(asc(customObject.createdAt))
}

export async function getBandRiders(bandId: string) {
  return db.query.rider.findMany({
    where: eq(rider.bandId, bandId),
    orderBy: [asc(rider.position), asc(rider.createdAt)],
    with: { items: { orderBy: [asc(riderItem.position), asc(riderItem.createdAt)] } },
  })
}

export type RiderFull = Awaited<ReturnType<typeof getBandRiders>>[number]

export const itemData = (i: RiderFull['items'][number]): RiderItemData => ({
  id: i.id,
  memberId: i.memberId,
  objectKey: i.objectKey,
  provider: i.provider,
  qty: i.qty,
  mic: i.mic,
  note: i.note,
})

export const memberData = (m: { id: string; name: string }): MemberData => ({
  id: m.id,
  name: m.name,
})

// Tout ce qu'il faut pour afficher les fiches d'un groupe.
export async function loadBandRiders(bandId: string) {
  const [riders, members] = await Promise.all([getBandRiders(bandId), riderMembers(bandId)])
  const customs = await bandCustoms(
    bandId,
    members.map((m) => m.userId).filter((x): x is string => Boolean(x)),
  )
  const defs = await objectDefs(customs)
  return { riders, members, customs, defs }
}

export type PlotData = PlotItem[]
