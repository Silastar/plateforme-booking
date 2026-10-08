import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

import { db } from '@/db'
import * as schema from '@/db/schema'

import { authMail } from './mail-templates'
import { sendMail } from './mailer'
import { MIN_PASSWORD } from './validation'

type Provider = 'google' | 'microsoft' | 'facebook' | 'apple'

// Un fournisseur n'apparaît que si ses deux clés sont renseignées dans les variables d'environnement.
function provider(name: Provider) {
  const id = process.env[`${name.toUpperCase()}_CLIENT_ID`]
  const secret = process.env[`${name.toUpperCase()}_CLIENT_SECRET`]
  return id && secret ? { clientId: id, clientSecret: secret } : undefined
}

const socialProviders = Object.fromEntries(
  (['google', 'microsoft', 'facebook', 'apple'] as const)
    .map((p) => [p, provider(p)] as const)
    .filter(([, cfg]) => cfg),
)

export const enabledProviders = Object.keys(socialProviders) as Provider[]

type MailUser = { email: string; name: string; locale?: string | null }

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  telemetry: { enabled: false },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  user: {
    additionalFields: {
      // Le rôle et le statut sont fixés par le serveur après l'inscription, jamais par le formulaire.
      role: { type: 'string', required: false, defaultValue: 'none', input: false },
      status: { type: 'string', required: false, defaultValue: 'active', input: false },
      locale: { type: 'string', required: false, defaultValue: 'fr', input: true },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: MIN_PASSWORD,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const u = user as MailUser
      await sendMail({ to: u.email, ...authMail('reset', u.locale ?? 'fr', u.name, url) })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const u = user as MailUser
      await sendMail({ to: u.email, ...authMail('verify', u.locale ?? 'fr', u.name, url) })
    },
  },
  socialProviders,
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
