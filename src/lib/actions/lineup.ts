'use server'

import { and, eq, ne } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

import { db } from '@/db'
import { band, bandMember, user } from '@/db/schema'
import { getBandForEdit } from '@/lib/bands'
import { lineupMail } from '@/lib/mail-templates'
import { sendMail } from '@/lib/mailer'
import { getSession } from '@/lib/session'

import type { FormState } from './types'

const ok: FormState = { status: 'saved', errors: {} }
const fail = (errors: Record<string, string>): FormState => ({ status: 'error', errors })
const base = () => process.env.BETTER_AUTH_URL ?? ''

const nameSchema = z.string().trim().min(1, 'required').max(120, 'tooLong')
const roleSchema = z.string().trim().max(80, 'tooLong')

async function adminCount(bandId: string) {
  const rows = await db
    .select({ id: bandMember.id })
    .from(bandMember)
    .where(
      and(
        eq(bandMember.bandId, bandId),
        eq(bandMember.isAdmin, true),
        eq(bandMember.status, 'active'),
      ),
    )
  return rows.length
}

// Actions de l'admin d'un groupe sur son line-up (champ « op » du formulaire).
export async function lineupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const b = await getBandForEdit(String(fd.get('bandId') ?? ''), session.user.id)
  if (!b) return fail({ form: 'forbidden' })
  const op = String(fd.get('op') ?? '')
  const memberId = String(fd.get('memberId') ?? '')
  const member = memberId
    ? await db.query.bandMember.findFirst({
        where: and(eq(bandMember.id, memberId), eq(bandMember.bandId, b.id)),
      })
    : undefined
  if (memberId && !member) return fail({ form: 'forbidden' })

  if (op === 'add') {
    const name = nameSchema.safeParse(fd.get('name') ?? '')
    const role = roleSchema.safeParse(fd.get('role') ?? '')
    if (!name.success) return fail({ name: name.error.issues[0].message })
    if (!role.success) return fail({ role: role.error.issues[0].message })
    await db.insert(bandMember).values({
      id: randomUUID(),
      bandId: b.id,
      name: name.data,
      role: role.data || null,
      isEssential: fd.get('isEssential') === 'on',
      status: 'active',
    })
    return ok
  }

  if (op === 'invite') {
    const email = z.email().safeParse(
      String(fd.get('email') ?? '')
        .trim()
        .toLowerCase(),
    )
    if (!email.success) return fail({ email: 'email' })
    const target = await db.query.user.findFirst({
      where: eq(user.email, email.data),
      with: { musician: true },
    })
    if (!target?.musician) return fail({ email: 'noMusician' })
    const already = await db.query.bandMember.findFirst({
      where: and(eq(bandMember.bandId, b.id), eq(bandMember.userId, target.id)),
    })
    if (already) return fail({ email: 'alreadyMember' })
    const role = roleSchema.safeParse(fd.get('role') ?? '')
    await db.insert(bandMember).values({
      id: randomUUID(),
      bandId: b.id,
      userId: target.id,
      role: role.success && role.data ? role.data : null,
      isEssential: fd.get('isEssential') === 'on',
      status: 'invited',
    })
    const path = target.locale === 'en' ? '/en/account/musician' : '/fr/compte/musicien'
    await sendMail({
      to: target.email,
      ...lineupMail(
        'invite',
        target.locale,
        target.musician.stageName,
        { band: b.name, actor: session.user.name },
        `${base()}${path}`,
      ),
    })
    return ok
  }

  if (!member) return fail({ form: 'forbidden' })

  if (op === 'update') {
    const role = roleSchema.safeParse(fd.get('role') ?? '')
    if (!role.success) return fail({ [`role-${member.id}`]: role.error.issues[0].message })
    const isAdmin = member.userId ? fd.get('isAdmin') === 'on' : false
    // Il reste toujours au moins un admin actif.
    if (member.isAdmin && !isAdmin && (await adminCount(b.id)) <= 1)
      return fail({ form: 'lastAdmin' })
    await db
      .update(bandMember)
      .set({ role: role.data || null, isEssential: fd.get('isEssential') === 'on', isAdmin })
      .where(eq(bandMember.id, member.id))
    return ok
  }

  if (op === 'remove' || op === 'decline') {
    if (member.isAdmin && member.status === 'active' && (await adminCount(b.id)) <= 1) {
      return fail({ form: 'lastAdmin' })
    }
    await db.delete(bandMember).where(eq(bandMember.id, member.id))
    return ok
  }

  if (op === 'accept' && member.status === 'requested') {
    await db.update(bandMember).set({ status: 'active' }).where(eq(bandMember.id, member.id))
    return ok
  }

  return fail({ form: 'invalid' })
}

// Côté musicien : répondre à une invitation, demander à rejoindre un groupe, quitter un groupe.
export async function musicianLineupAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const me = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    with: { musician: true },
  })
  if (!me?.musician) return fail({ form: 'forbidden' })
  const op = String(fd.get('op') ?? '')

  if (op === 'request') {
    const target = await db.query.band.findFirst({
      where: eq(band.id, String(fd.get('bandId') ?? '')),
    })
    if (!target) return fail({ form: 'invalid' })
    const already = await db.query.bandMember.findFirst({
      where: and(eq(bandMember.bandId, target.id), eq(bandMember.userId, me.id)),
    })
    if (already) return fail({ form: 'alreadyMember' })
    await db.insert(bandMember).values({
      id: randomUUID(),
      bandId: target.id,
      userId: me.id,
      // Le rôle est laissé à l'admin du groupe (l'instrument est un code, pas un texte affichable).
      role: null,
      status: 'requested',
    })
    const admins = await db.query.bandMember.findMany({
      where: and(
        eq(bandMember.bandId, target.id),
        eq(bandMember.isAdmin, true),
        eq(bandMember.status, 'active'),
      ),
      with: { user: true },
    })
    for (const a of admins) {
      if (!a.user) continue
      const path =
        a.user.locale === 'en' ? `/en/account/band/${target.id}` : `/fr/compte/groupe/${target.id}`
      await sendMail({
        to: a.user.email,
        ...lineupMail(
          'request',
          a.user.locale,
          a.user.name,
          { band: target.name, actor: me.musician.stageName },
          `${base()}${path}`,
        ),
      })
    }
    return ok
  }

  const link = await db.query.bandMember.findFirst({
    where: and(eq(bandMember.id, String(fd.get('memberId') ?? '')), eq(bandMember.userId, me.id)),
  })
  if (!link) return fail({ form: 'forbidden' })

  if (op === 'accept' && link.status === 'invited') {
    await db.update(bandMember).set({ status: 'active' }).where(eq(bandMember.id, link.id))
    return ok
  }
  if (op === 'decline' || op === 'cancel' || op === 'leave') {
    if (link.isAdmin && link.status === 'active') {
      const others = await db
        .select({ id: bandMember.id })
        .from(bandMember)
        .where(
          and(
            eq(bandMember.bandId, link.bandId),
            eq(bandMember.isAdmin, true),
            eq(bandMember.status, 'active'),
            ne(bandMember.id, link.id),
          ),
        )
      if (others.length === 0) return fail({ form: 'lastAdmin' })
    }
    await db.delete(bandMember).where(eq(bandMember.id, link.id))
    return ok
  }
  return fail({ form: 'invalid' })
}
