'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { getLocale } from 'next-intl/server'
import { randomUUID } from 'node:crypto'

import { db } from '@/db'
import { application, bandMember, gig, user } from '@/db/schema'
import { getPathname, redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getBandForEdit } from '@/lib/bands'
import { addDays, todayIso } from '@/lib/calendar'
import { orNull, readForm } from '@/lib/form-data'
import { applicationSchema, GIG_FIELDS, gigSchema, repeatDays } from '@/lib/gig-rules'
import { canSeeGig, getGigForOrga, getGigPage } from '@/lib/gigs'
import { gigMail, mailDate } from '@/lib/mail-templates'
import { sendMail } from '@/lib/mailer'
import { getOrgaForEdit } from '@/lib/orgas'
import { getSession } from '@/lib/session'
import { fieldErrors } from '@/lib/validation'

import type { FormState } from './types'

const ok: FormState = { status: 'saved', errors: {} }
const fail = (errors: Record<string, string>): FormState => ({ status: 'error', errors })
const base = () => process.env.BETTER_AUTH_URL ?? ''
const loc = (l: string): Locale => (l === 'en' ? 'en' : 'fr')

// Publication (gigId vide, avec répétition éventuelle) ou modification d'une date de l'orga connectée.
export async function saveGig(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const orga = await getOrgaForEdit(session.user.id)
  if (!orga) return fail({ form: 'forbidden' })
  const gigId = String(fd.get('gigId') ?? '')
  const existing = gigId ? await getGigForOrga(gigId, session.user.id) : null
  if (gigId && (!existing || existing.status !== 'open')) return fail({ form: 'forbidden' })

  const parsed = gigSchema.safeParse(readForm(fd, GIG_FIELDS))
  if (!parsed.success) return fail(fieldErrors(parsed.error))
  const v = parsed.data
  if (v.venueId && !orga.venues.some((x) => x.id === v.venueId)) return fail({ venueId: 'invalid' })

  const today = todayIso()
  const days = existing ? [v.day] : repeatDays(v.day, v.repeat, v.repeatCount ?? 1)
  if (days[0] < today) return fail({ day: 'past' })
  if (days[days.length - 1] > addDays(today, 730)) return fail({ day: 'tooFar' })

  const values = {
    venueId: v.venueId || null,
    loadIn: orNull(v.loadIn),
    setStart: orNull(v.setStart),
    curfew: orNull(v.curfew),
    genres: v.genres,
    format: v.format,
    bandsCount: v.format === 'bill' ? (v.bandsCount ?? 2) : 1,
    setLength: v.setLength ?? null,
    budgetMin: v.budgetMin ?? null,
    budgetMax: v.budgetMax ?? null,
    includes: v.includes,
    visibility: v.visibility,
    note: orNull(v.note),
  }

  if (existing) {
    await db
      .update(gig)
      .set({ ...values, day: v.day })
      .where(eq(gig.id, existing.id))
    return ok
  }
  const seriesId = days.length > 1 ? randomUUID() : null
  await db
    .insert(gig)
    .values(
      days.map((day) => ({ id: randomUUID(), organizationId: orga.id, day, seriesId, ...values })),
    )
  const locale = loc(await getLocale())
  return redirect({ href: { pathname: '/compte/dates', query: { publie: days.length } }, locale })
}

// Annulation : les candidatures en attente sont closes et les groupes prévenus.
export async function cancelGig(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const g = await getGigForOrga(String(fd.get('gigId') ?? ''), session.user.id)
  if (!g || g.status !== 'open') return fail({ form: 'forbidden' })
  await db.update(gig).set({ status: 'cancelled' }).where(eq(gig.id, g.id))
  const pending = await db.query.application.findMany({
    where: and(eq(application.gigId, g.id), eq(application.status, 'pending')),
    with: { band: true },
  })
  if (pending.length) {
    await db
      .update(application)
      .set({ status: 'cancelled' })
      .where(
        inArray(
          application.id,
          pending.map((a) => a.id),
        ),
      )
    for (const a of pending) await notifyBand('cancelled', a.band, g.organization.name, g.day)
  }
  return ok
}

export async function declineApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const a = await db.query.application.findFirst({
    where: eq(application.id, String(fd.get('applicationId') ?? '')),
    with: { band: true, gig: { with: { organization: true } } },
  })
  if (!a || a.gig.organization.ownerId !== session.user.id || a.status !== 'pending')
    return fail({ form: 'forbidden' })
  await db.update(application).set({ status: 'declined' }).where(eq(application.id, a.id))
  await notifyBand('declined', a.band, a.gig.organization.name, a.gig.day)
  return ok
}

// Candidature d'un groupe (dont l'utilisateur est admin) à une date en annonce ouverte.
export async function applyToGig(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const parsed = applicationSchema.safeParse({
    bandId: String(fd.get('bandId') ?? ''),
    fee: String(fd.get('fee') ?? ''),
    message: String(fd.get('message') ?? ''),
  })
  if (!parsed.success) return fail(fieldErrors(parsed.error))
  const v = parsed.data
  const b = await getBandForEdit(v.bandId, session.user.id)
  if (!b) return fail({ bandId: 'forbidden' })
  const g = await getGigPage(String(fd.get('gigId') ?? ''))
  if (
    !g ||
    !canSeeGig(g, null) ||
    g.status !== 'open' ||
    g.visibility !== 'open' ||
    g.day < todayIso()
  )
    return fail({ form: 'closed' })

  const prior = await db.query.application.findFirst({
    where: and(eq(application.gigId, g.id), eq(application.bandId, b.id)),
  })
  if (prior && prior.status !== 'withdrawn') return fail({ form: 'alreadyApplied' })
  const values = {
    userId: session.user.id,
    message: orNull(v.message),
    fee: v.fee ?? null,
    status: 'pending',
  }
  if (prior) await db.update(application).set(values).where(eq(application.id, prior.id))
  else
    await db.insert(application).values({ id: randomUUID(), gigId: g.id, bandId: b.id, ...values })

  const owner = g.organization.owner
  const l = loc(owner.locale)
  await sendMail({
    to: owner.email,
    ...gigMail(
      'application',
      l,
      owner.name,
      { band: b.name, orga: g.organization.name, date: mailDate(g.day, l) },
      `${base()}${getPathname({ locale: l, href: { pathname: '/compte/dates', query: { date: g.id } } })}`,
    ),
  })
  return ok
}

export async function withdrawApplication(_prev: FormState, fd: FormData): Promise<FormState> {
  const session = await getSession()
  if (!session) return fail({ form: 'auth' })
  const a = await db.query.application.findFirst({
    where: eq(application.id, String(fd.get('applicationId') ?? '')),
  })
  if (!a || a.status !== 'pending' || !(await getBandForEdit(a.bandId, session.user.id)))
    return fail({ form: 'forbidden' })
  await db.update(application).set({ status: 'withdrawn' }).where(eq(application.id, a.id))
  return ok
}

// Prévient les admins du groupe (chacun dans sa langue).
async function notifyBand(
  kind: 'declined' | 'cancelled',
  b: { id: string; name: string },
  orgaName: string,
  day: string,
) {
  const admins = await db
    .select({ email: user.email, name: user.name, locale: user.locale })
    .from(bandMember)
    .innerJoin(user, eq(user.id, bandMember.userId))
    .where(
      and(
        eq(bandMember.bandId, b.id),
        eq(bandMember.isAdmin, true),
        eq(bandMember.status, 'active'),
      ),
    )
  for (const a of admins) {
    const l = loc(a.locale)
    await sendMail({
      to: a.email,
      ...gigMail(
        kind,
        l,
        a.name,
        { band: b.name, orga: orgaName, date: mailDate(day, l) },
        `${base()}${getPathname({ locale: l, href: '/dates' })}`,
      ),
    })
  }
}
