import { isAPIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { db } from '@/db'
import { user } from '@/db/schema'
import { auth } from '@/lib/auth'
import { authMail } from '@/lib/mail-templates'
import { sendMail } from '@/lib/mailer'
import { createProfile } from '@/lib/profiles'
import { fieldErrors, registerSchema } from '@/lib/validation'

// Inscription par e-mail : compte (Better Auth, e-mail de vérification envoyé) + profil, en une fois.
export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 })
  }
  const { locale, account, profile } = parsed.data

  // Adresse déjà inscrite : même réponse qu'une inscription réussie (on ne révèle pas qui est inscrit),
  // et un e-mail prévient la personne qu'elle a déjà un compte.
  const existing = await db.query.user.findFirst({ where: eq(user.email, account.email) })
  if (existing) {
    const base = process.env.BETTER_AUTH_URL ?? ''
    const loginUrl = `${base}/${existing.locale === 'en' ? 'en/login' : 'fr/connexion'}`
    await sendMail({
      to: existing.email,
      ...authMail('exists', existing.locale, existing.name, loginUrl),
    })
    return NextResponse.json({ ok: true, email: account.email })
  }

  let userId: string
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: `${account.firstName} ${account.lastName}`,
        email: account.email,
        password: account.password,
        locale,
        callbackURL: `/${locale}/${locale === 'fr' ? 'compte' : 'account'}?verifie=1`,
      },
      headers: request.headers,
    })
    userId = result.user.id
  } catch (e) {
    if (isAPIError(e) && String(e.body?.code ?? '').startsWith('USER_ALREADY_EXISTS')) {
      return NextResponse.json({ errors: { 'account.email': 'exists' } }, { status: 409 })
    }
    console.error('[inscription] création du compte impossible', e)
    return NextResponse.json({ errors: { form: 'server' } }, { status: 500 })
  }

  try {
    await createProfile(userId, profile)
  } catch (e) {
    // Pas de compte à moitié créé : on retire le compte si le profil n'a pas pu être enregistré.
    console.error('[inscription] création du profil impossible', e)
    await db.delete(user).where(eq(user.id, userId))
    return NextResponse.json({ errors: { form: 'server' } }, { status: 500 })
  }

  return NextResponse.json({ ok: true, email: account.email })
}
