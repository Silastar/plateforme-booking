'use server'

import { and, asc, eq, inArray, max } from 'drizzle-orm'
import { getLocale } from 'next-intl/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { db } from '@/db'
import {
  bandMember,
  customObject,
  musicianGear,
  rider,
  riderItem,
  type PlotItem,
} from '@/db/schema'
import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getBandForEdit } from '@/lib/bands'
import { orNull } from '@/lib/form-data'
import { INSTRUMENT_TEMPLATES, isCatalogKey, MONITORS, STANDS } from '@/lib/rider-catalog'
import { PLOT_COLS, PLOT_ROWS } from '@/lib/rider-core'
import { riderMembers } from '@/lib/riders'
import { getSession } from '@/lib/session'
import { fieldErrors } from '@/lib/validation'

import type { FormState } from './types'

type Result = { ok: boolean }
const ok: FormState = { status: 'saved', errors: {} }
const fail = (errors: Record<string, string>): FormState => ({ status: 'error', errors })
const loc = (l: string): Locale => (l === 'en' ? 'en' : 'fr')

// Configuration modifiable par l'utilisateur connecté (admin du groupe), sinon null.
async function editableRider(riderId: string) {
  const session = await getSession()
  if (!session) return null
  const r = await db.query.rider.findFirst({ where: eq(rider.id, riderId) })
  if (!r) return null
  const band = await getBandForEdit(r.bandId, session.user.id)
  return band ? { rider: r, band, userId: session.user.id } : null
}

// Une clé d'objet est valable si elle est au catalogue ou si l'objet perso appartient au groupe
// ou à l'un de ses musiciens.
async function validKey(key: string, bandId: string) {
  if (isCatalogKey(key)) return true
  const m = key.match(/^custom:(.+)$/)
  if (!m) return false
  const c = await db.query.customObject.findFirst({ where: eq(customObject.id, m[1]) })
  if (!c) return false
  if (c.bandId === bandId) return true
  if (!c.userId) return false
  const member = await db.query.bandMember.findFirst({
    where: and(eq(bandMember.bandId, bandId), eq(bandMember.userId, c.userId)),
  })
  return Boolean(member)
}

async function validMember(memberId: string | null, bandId: string) {
  if (!memberId) return true
  const m = await db.query.bandMember.findFirst({ where: eq(bandMember.id, memberId) })
  return m?.bandId === bandId
}

async function nextPosition(riderId: string) {
  const [row] = await db
    .select({ p: max(riderItem.position) })
    .from(riderItem)
    .where(eq(riderItem.riderId, riderId))
  return (row?.p ?? -1) + 1
}

/* ---------- Configurations ---------- */

const nameSchema = z.string().trim().min(1, 'required').max(60, 'tooLong')

export async function createRider(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const band = await getBandForEdit(String(fd.get('bandId') ?? ''), session.user.id)
  if (!band) return fail({ form: 'forbidden' })
  const name = nameSchema.safeParse(fd.get('name') ?? '')
  if (!name.success) return fail(fieldErrors(name.error))
  const from = String(fd.get('from') ?? '')

  const [pos] = await db
    .select({ p: max(rider.position) })
    .from(rider)
    .where(eq(rider.bandId, band.id))
  const id = randomUUID()
  const source =
    from && from !== 'prefill'
      ? await db.query.rider.findFirst({ where: eq(rider.id, from) })
      : null
  if (source && source.bandId !== band.id) return fail({ form: 'forbidden' })

  await db.transaction(async (tx) => {
    await tx.insert(rider).values({
      id,
      bandId: band.id,
      name: name.data,
      position: (pos?.p ?? -1) + 1,
      ...(source
        ? {
            engineer: source.engineer,
            setupMinutes: source.setupMinutes,
            soundcheckMinutes: source.soundcheckMinutes,
            changeoverMinutes: source.changeoverMinutes,
            minStage: source.minStage,
            people: source.people,
            meals: source.meals,
            greenRoom: source.greenRoom,
            drinks: source.drinks,
            parking: source.parking,
            lodging: source.lodging,
            iemNote: source.iemNote,
            monitorNotes: source.monitorNotes,
          }
        : {}),
    })
    if (source) {
      const items = await tx.select().from(riderItem).where(eq(riderItem.riderId, source.id))
      if (items.length)
        await tx
          .insert(riderItem)
          .values(items.map((i) => ({ ...i, id: randomUUID(), riderId: id, createdAt: undefined })))
    } else if (from === 'prefill') {
      // Matériel perso du musicien s'il en a, sinon les objets types de son instrument.
      const members = await riderMembers(band.id)
      const userIds = members.map((m) => m.userId).filter((x): x is string => Boolean(x))
      const gear = userIds.length
        ? await tx
            .select()
            .from(musicianGear)
            .where(inArray(musicianGear.userId, userIds))
            .orderBy(asc(musicianGear.position))
        : []
      const values: (typeof riderItem.$inferInsert)[] = []
      for (const m of members) {
        const own = gear.filter((g) => g.userId === m.userId)
        const keys = own.length
          ? own.map((g) => ({
              objectKey: g.objectKey,
              qty: g.qty,
              mic: g.mic,
              note: g.note,
              provider: 'band',
            }))
          : (INSTRUMENT_TEMPLATES[m.instrument ?? ''] ?? []).map((k) => ({
              objectKey: k,
              qty: 1,
              mic: null,
              note: null,
              provider:
                k === 'drumKit' || k === 'wedge' || k === 'power' || k === 'vocal'
                  ? 'venue'
                  : 'band',
            }))
        for (const k of keys)
          values.push({
            id: randomUUID(),
            riderId: id,
            memberId: m.id,
            position: values.length,
            ...k,
          })
      }
      if (values.length) await tx.insert(riderItem).values(values)
    }
  })
  return redirect({
    href: {
      pathname: '/compte/groupe/[id]/fiche-technique',
      params: { id: band.id },
      query: { config: id },
    },
    locale: loc(await getLocale()),
  })
}

export async function renameRider(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await editableRider(String(fd.get('riderId') ?? ''))
  if (!r) return fail({ form: 'forbidden' })
  const name = nameSchema.safeParse(fd.get('name') ?? '')
  if (!name.success) return fail(fieldErrors(name.error))
  await db.update(rider).set({ name: name.data }).where(eq(rider.id, r.rider.id))
  return ok
}

export async function deleteRider(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await editableRider(String(fd.get('riderId') ?? ''))
  if (!r) return fail({ form: 'forbidden' })
  await db.delete(rider).where(eq(rider.id, r.rider.id))
  return redirect({
    href: { pathname: '/compte/groupe/[id]/fiche-technique', params: { id: r.band.id } },
    locale: loc(await getLocale()),
  })
}

/* ---------- Objets ---------- */

export async function addRiderItem(
  riderId: string,
  memberId: string | null,
  objectKey: string,
): Promise<Result> {
  const r = await editableRider(riderId)
  if (!r || !(await validMember(memberId, r.band.id)) || !(await validKey(objectKey, r.band.id)))
    return { ok: false }
  const def = isCatalogKey(objectKey) ? objectKey : null
  await db.insert(riderItem).values({
    id: randomUUID(),
    riderId,
    memberId,
    objectKey,
    // Le corps de batterie, les retours, les prises et les micros chant viennent en général de la salle.
    provider:
      def && ['drumKit', 'wedge', 'power', 'vocal', 'backing', 'riser', 'sidefill'].includes(def)
        ? 'venue'
        : 'band',
    position: await nextPosition(riderId),
  })
  return { ok: true }
}

const itemPatch = z.object({
  provider: z.enum(['band', 'venue']).optional(),
  qty: z.number().int().min(1).max(20).optional(),
  mic: z.string().trim().max(40).nullable().optional(),
  note: z.string().trim().max(200).nullable().optional(),
})

export async function updateRiderItem(
  itemId: string,
  patch: z.infer<typeof itemPatch>,
): Promise<Result> {
  const parsed = itemPatch.safeParse(patch)
  if (!parsed.success) return { ok: false }
  const item = await db.query.riderItem.findFirst({ where: eq(riderItem.id, itemId) })
  if (!item || !(await editableRider(item.riderId))) return { ok: false }
  const v = parsed.data
  await db
    .update(riderItem)
    .set({
      ...(v.provider ? { provider: v.provider } : {}),
      ...(v.qty ? { qty: v.qty } : {}),
      ...(v.mic !== undefined ? { mic: v.mic || null } : {}),
      ...(v.note !== undefined ? { note: v.note || null } : {}),
    })
    .where(eq(riderItem.id, itemId))
  return { ok: true }
}

export async function removeRiderItem(itemId: string): Promise<Result> {
  const item = await db.query.riderItem.findFirst({ where: eq(riderItem.id, itemId) })
  if (!item || !(await editableRider(item.riderId))) return { ok: false }
  await db.delete(riderItem).where(eq(riderItem.id, itemId))
  return { ok: true }
}

const customSchema = z.object({
  name: z.string().trim().min(1, 'required').max(60, 'tooLong'),
  inputs: z.array(z.string().trim().min(1).max(40)).max(16, 'tooMany'),
  mic: z.string().trim().max(40, 'tooLong'),
  stand: z.enum(STANDS as [string, ...string[]]),
  monitor: z.union([z.literal(''), z.enum(MONITORS as [string, ...string[]])]),
})

const readCustom = (fd: FormData) =>
  customSchema.safeParse({
    name: String(fd.get('name') ?? ''),
    inputs: String(fd.get('inputs') ?? '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    mic: String(fd.get('mic') ?? ''),
    stand: String(fd.get('stand') ?? 'none'),
    monitor: String(fd.get('monitor') ?? ''),
  })

// Objet perso du groupe, ajouté aussitôt au membre choisi.
export async function createCustomObject(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await editableRider(String(fd.get('riderId') ?? ''))
  if (!r) return fail({ form: 'forbidden' })
  const memberId = String(fd.get('memberId') ?? '') || null
  if (!(await validMember(memberId, r.band.id))) return fail({ form: 'forbidden' })
  const parsed = readCustom(fd)
  if (!parsed.success) return fail(fieldErrors(parsed.error))
  const v = parsed.data
  const id = randomUUID()
  await db.insert(customObject).values({
    id,
    bandId: r.band.id,
    name: v.name,
    inputs: v.inputs,
    mic: orNull(v.mic),
    stand: v.stand,
    monitor: orNull(v.monitor),
  })
  await db.insert(riderItem).values({
    id: randomUUID(),
    riderId: r.rider.id,
    memberId,
    objectKey: `custom:${id}`,
    position: await nextPosition(r.rider.id),
  })
  return ok
}

// Copie le matériel perso d'un musicien dans la configuration, pour ce membre.
export async function importMemberGear(riderId: string, memberId: string): Promise<Result> {
  const r = await editableRider(riderId)
  if (!r) return { ok: false }
  const m = await db.query.bandMember.findFirst({ where: eq(bandMember.id, memberId) })
  if (!m || m.bandId !== r.band.id || !m.userId) return { ok: false }
  const gear = await db
    .select()
    .from(musicianGear)
    .where(eq(musicianGear.userId, m.userId))
    .orderBy(asc(musicianGear.position))
  if (!gear.length) return { ok: false }
  let pos = await nextPosition(riderId)
  await db.insert(riderItem).values(
    gear.map((g) => ({
      id: randomUUID(),
      riderId,
      memberId,
      objectKey: g.objectKey,
      qty: g.qty,
      mic: g.mic,
      note: g.note,
      provider: 'band',
      position: pos++,
    })),
  )
  return { ok: true }
}

/* ---------- Entrées, plan, retours, infos ---------- */

export async function setPatchOrder(riderId: string, keys: string[]): Promise<Result> {
  const r = await editableRider(riderId)
  const parsed = z.array(z.string().max(120)).max(400).safeParse(keys)
  if (!r || !parsed.success) return { ok: false }
  await db.update(rider).set({ patchOrder: parsed.data }).where(eq(rider.id, riderId))
  return { ok: true }
}

const plotSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(80),
      kind: z.enum(['member', 'object', 'riser', 'wedge', 'power', 'note']),
      label: z.string().trim().max(40),
      memberId: z.string().max(80).optional(),
      x: z.number().int().min(0),
      y: z.number().int().min(0),
      w: z.number().int().min(1).max(4),
      h: z.number().int().min(1).max(3),
    }),
  )
  .max(60)
  .refine((items) => items.every((p) => p.x + p.w <= PLOT_COLS && p.y + p.h <= PLOT_ROWS))

export async function savePlot(riderId: string, plot: PlotItem[]): Promise<Result> {
  const r = await editableRider(riderId)
  const parsed = plotSchema.safeParse(plot)
  if (!r || !parsed.success) return { ok: false }
  await db.update(rider).set({ plot: parsed.data }).where(eq(rider.id, riderId))
  return { ok: true }
}

const optInt = (maxValue: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number('number').int('number').min(0, 'number').max(maxValue, 'number').optional(),
  )
const optText = (n: number) => z.string().trim().max(n, 'tooLong')

const infoSchema = z.object({
  engineer: optText(80),
  setupMinutes: optInt(600),
  soundcheckMinutes: optInt(600),
  changeoverMinutes: optInt(600),
  minStage: optText(40),
  people: optInt(60),
  meals: optText(160),
  greenRoom: optText(160),
  drinks: optText(160),
  parking: optText(160),
  lodging: optText(160),
})

export async function saveRiderInfo(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await editableRider(String(fd.get('riderId') ?? ''))
  if (!r) return fail({ form: 'forbidden' })
  const raw = Object.fromEntries(
    Object.keys(infoSchema.shape).map((k) => [k, String(fd.get(k) ?? '')]),
  )
  const parsed = infoSchema.safeParse(raw)
  if (!parsed.success) return fail(fieldErrors(parsed.error))
  const v = parsed.data
  await db
    .update(rider)
    .set({
      engineer: orNull(v.engineer),
      setupMinutes: v.setupMinutes ?? null,
      soundcheckMinutes: v.soundcheckMinutes ?? null,
      changeoverMinutes: v.changeoverMinutes ?? null,
      minStage: orNull(v.minStage),
      people: v.people ?? null,
      meals: orNull(v.meals),
      greenRoom: orNull(v.greenRoom),
      drinks: orNull(v.drinks),
      parking: orNull(v.parking),
      lodging: orNull(v.lodging),
    })
    .where(eq(rider.id, r.rider.id))
  return ok
}

// Note in-ear et « ce que je veux entendre » par membre (champs note-<memberId>).
export async function saveMonitors(_prev: FormState, fd: FormData): Promise<FormState> {
  const r = await editableRider(String(fd.get('riderId') ?? ''))
  if (!r) return fail({ form: 'forbidden' })
  const iem = optText(400).safeParse(String(fd.get('iemNote') ?? ''))
  if (!iem.success) return fail({ iemNote: 'tooLong' })
  const notes: Record<string, string> = {}
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith('note-')) continue
    const text = String(v).trim().slice(0, 160)
    if (text) notes[k.slice(5)] = text
  }
  await db
    .update(rider)
    .set({ iemNote: orNull(iem.data), monitorNotes: notes })
    .where(eq(rider.id, r.rider.id))
  return ok
}

/* ---------- Matériel perso du musicien ---------- */

async function currentMusician() {
  const session = await getSession()
  if (!session) return null
  const m = await db.query.musician.findFirst({
    where: (t, { eq: e }) => e(t.userId, session.user.id),
  })
  return m ? session.user.id : null
}

export async function addGear(objectKey: string): Promise<Result> {
  const userId = await currentMusician()
  if (!userId) return { ok: false }
  if (!isCatalogKey(objectKey)) {
    const id = objectKey.match(/^custom:(.+)$/)?.[1]
    const c = id ? await db.query.customObject.findFirst({ where: eq(customObject.id, id) }) : null
    if (!c || c.userId !== userId) return { ok: false }
  }
  const [row] = await db
    .select({ p: max(musicianGear.position) })
    .from(musicianGear)
    .where(eq(musicianGear.userId, userId))
  await db
    .insert(musicianGear)
    .values({ id: randomUUID(), userId, objectKey, position: (row?.p ?? -1) + 1 })
  return { ok: true }
}

export async function updateGear(
  gearId: string,
  patch: z.infer<typeof itemPatch>,
): Promise<Result> {
  const userId = await currentMusician()
  const parsed = itemPatch.safeParse(patch)
  if (!userId || !parsed.success) return { ok: false }
  const v = parsed.data
  await db
    .update(musicianGear)
    .set({
      ...(v.qty ? { qty: v.qty } : {}),
      ...(v.mic !== undefined ? { mic: v.mic || null } : {}),
      ...(v.note !== undefined ? { note: v.note || null } : {}),
    })
    .where(and(eq(musicianGear.id, gearId), eq(musicianGear.userId, userId)))
  return { ok: true }
}

export async function removeGear(gearId: string): Promise<Result> {
  const userId = await currentMusician()
  if (!userId) return { ok: false }
  await db
    .delete(musicianGear)
    .where(and(eq(musicianGear.id, gearId), eq(musicianGear.userId, userId)))
  return { ok: true }
}

export async function createGearCustom(_prev: FormState, fd: FormData): Promise<FormState> {
  const userId = await currentMusician()
  if (!userId) return fail({ form: 'forbidden' })
  const parsed = readCustom(fd)
  if (!parsed.success) return fail(fieldErrors(parsed.error))
  const v = parsed.data
  const id = randomUUID()
  await db.insert(customObject).values({
    id,
    userId,
    name: v.name,
    inputs: v.inputs,
    mic: orNull(v.mic),
    stand: v.stand,
    monitor: orNull(v.monitor),
  })
  const [row] = await db
    .select({ p: max(musicianGear.position) })
    .from(musicianGear)
    .where(eq(musicianGear.userId, userId))
  await db
    .insert(musicianGear)
    .values({ id: randomUUID(), userId, objectKey: `custom:${id}`, position: (row?.p ?? -1) + 1 })
  return ok
}
