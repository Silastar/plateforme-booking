import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { createProfile } from '@/lib/profiles'
import { fieldErrors, profileSchema } from '@/lib/validation'

// Profil d'un compte déjà connecté qui n'en a pas encore (connexion Google, Microsoft, …).
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ errors: { form: 'auth' } }, { status: 401 })
  if ((session.user as { role?: string }).role !== 'none') {
    return NextResponse.json({ errors: { form: 'already' } }, { status: 409 })
  }
  const parsed = profileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 400 })
  }
  await createProfile(session.user.id, parsed.data)
  return NextResponse.json({ ok: true })
}
