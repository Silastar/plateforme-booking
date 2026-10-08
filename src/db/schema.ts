import { relations } from 'drizzle-orm'
import { boolean, integer, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

/* ---------- Comptes (tables attendues par Better Auth) ---------- */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // none (profil pas encore choisi) | orga | groupe | musicien | admin
  role: text('role').notNull().default('none'),
  // active | pending (orga en attente de validation) | suspended
  status: text('status').notNull().default('active'),
  locale: text('locale').notNull().default('fr'),
  ...timestamps,
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ...timestamps,
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ...timestamps,
})

/* ---------- Profils (le minimum de l'inscription ; complétés à l'étape 3) ---------- */

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // salle | bar | festival | association | prive
  type: text('type').notNull(),
  city: text('city').notNull(),
  capacity: integer('capacity'),
  website: text('website'),
  ...timestamps,
})

export const band = pgTable('band', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  mainGenre: text('main_genre').notNull(),
  city: text('city').notNull(),
  musiciansCount: integer('musicians_count'),
  listenUrl: text('listen_url').notNull(),
  ...timestamps,
})

// Line-up : un musicien peut être dans plusieurs groupes, avec un rôle par groupe.
export const bandMember = pgTable(
  'band_member',
  {
    bandId: text('band_id')
      .notNull()
      .references(() => band.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role'),
    isAdmin: boolean('is_admin').notNull().default(false),
    isEssential: boolean('is_essential').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bandId, t.userId] })],
)

export const musician = pgTable('musician', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  stageName: text('stage_name').notNull(),
  mainInstrument: text('main_instrument').notNull(),
  otherInstruments: text('other_instruments'),
  city: text('city').notNull(),
  // amateur | semipro | pro
  level: text('level').notNull(),
  availableForSubs: boolean('available_for_subs').notNull().default(false),
  ...timestamps,
})

export const userRelations = relations(user, ({ many, one }) => ({
  organizations: many(organization),
  memberships: many(bandMember),
  musician: one(musician, { fields: [user.id], references: [musician.userId] }),
}))

export const bandRelations = relations(band, ({ many }) => ({
  members: many(bandMember),
}))

export const bandMemberRelations = relations(bandMember, ({ one }) => ({
  band: one(band, { fields: [bandMember.bandId], references: [band.id] }),
  user: one(user, { fields: [bandMember.userId], references: [user.id] }),
}))

export const organizationRelations = relations(organization, ({ one }) => ({
  owner: one(user, { fields: [organization.ownerId], references: [user.id] }),
}))
