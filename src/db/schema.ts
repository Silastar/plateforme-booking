import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

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

/* ---------- Profils ---------- */

// Fichiers envoyés (photos, fiche technique) : chemin public « /media/<nom> ».
const media = (name: string) => text(name)

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  slug: text('slug').unique(),
  name: text('name').notNull(),
  // salle | bar | festival | association | prive
  type: text('type').notNull(),
  city: text('city').notNull(),
  capacity: integer('capacity'),
  website: text('website'),
  description: text('description'),
  logo: media('logo'),
  cover: media('cover'),
  since: integer('since'),
  // Ce qu'on programme
  genres: text('genres').array().notNull().default([]),
  eventTypes: text('event_types'),
  bandsPerNight: text('bands_per_night'),
  setLength: text('set_length'),
  rhythm: text('rhythm'),
  // Conditions habituelles
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  feeTerms: text('fee_terms'),
  ...timestamps,
})

// Lieux d'une orga (une salle peut en avoir plusieurs : grande salle, club…).
export const venue = pgTable('venue', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  address: text('address'),
  postalCode: text('postal_code'),
  city: text('city').notNull(),
  capacity: integer('capacity'),
  indoor: boolean('indoor').notNull().default(true),
  stageSize: text('stage_size'),
  paProvided: boolean('pa_provided').notNull().default(false),
  lightsProvided: boolean('lights_provided').notNull().default(false),
  engineerOnSite: boolean('engineer_on_site').notNull().default(false),
  backline: text('backline'),
  greenRoom: boolean('green_room').notNull().default(false),
  catering: boolean('catering').notNull().default(false),
  loadIn: text('load_in'),
  curfew: text('curfew'),
  photo: media('photo'),
  ...timestamps,
})

export const band = pgTable('band', {
  id: text('id').primaryKey(),
  slug: text('slug').unique(),
  name: text('name').notNull(),
  mainGenre: text('main_genre').notNull(),
  genres: text('genres').array().notNull().default([]),
  city: text('city').notNull(),
  musiciansCount: integer('musicians_count'),
  listenUrl: text('listen_url').notNull(),
  photo: media('photo'),
  since: integer('since'),
  // compos | reprises | mixte
  repertoire: text('repertoire'),
  setMin: integer('set_min'),
  setMax: integer('set_max'),
  bio: text('bio'),
  story: text('story'),
  discography: text('discography'),
  press: text('press'),
  // Médias (chargés seulement au clic du visiteur)
  spotifyUrl: text('spotify_url'),
  bandcampUrl: text('bandcamp_url'),
  soundcloudUrl: text('soundcloud_url'),
  youtubeUrl: text('youtube_url'),
  // Fiche technique
  rider: media('rider'),
  lineupDetail: text('lineup_detail'),
  backline: text('backline'),
  ownEngineer: boolean('own_engineer').notNull().default(false),
  setupMinutes: integer('setup_minutes'),
  minStage: text('min_stage'),
  // Zone et cachet
  radiusKm: integer('radius_km'),
  regions: text('regions'),
  feeMin: integer('fee_min'),
  feeMax: integer('fee_max'),
  feeNote: text('fee_note'),
  ...timestamps,
})

// Line-up : un musicien peut être dans plusieurs groupes, avec un rôle par groupe.
// Un membre sans compte reste un simple nom (user_id vide).
export const bandMember = pgTable('band_member', {
  id: text('id').primaryKey(),
  bandId: text('band_id')
    .notNull()
    .references(() => band.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  name: text('name'),
  role: text('role'),
  isAdmin: boolean('is_admin').notNull().default(false),
  isEssential: boolean('is_essential').notNull().default(true),
  // active | invited (le groupe a invité) | requested (le musicien demande)
  status: text('status').notNull().default('active'),
  inviteEmail: text('invite_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const musician = pgTable('musician', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  slug: text('slug').unique(),
  stageName: text('stage_name').notNull(),
  mainInstrument: text('main_instrument').notNull(),
  otherInstruments: text('other_instruments'),
  city: text('city').notNull(),
  // amateur | semipro | pro
  level: text('level').notNull(),
  styles: text('styles').array().notNull().default([]),
  photo: media('photo'),
  bio: text('bio'),
  videoUrl: text('video_url'),
  videoUrl2: text('video_url_2'),
  // Dépannage
  availableForSubs: boolean('available_for_subs').notNull().default(false),
  subInstruments: text('sub_instruments'),
  subRadiusKm: integer('sub_radius_km'),
  subNoticeDays: integer('sub_notice_days'),
  repertoireNote: text('repertoire_note'),
  gearNote: text('gear_note'),
  ...timestamps,
})

/* ---------- Calendriers ---------- */

// Soir où le groupe se dit dispo pour jouer. Le calendrier part vierge : rien de coché = pas dispo.
export const bandAvailability = pgTable(
  'band_availability',
  {
    id: text('id').primaryKey(),
    bandId: text('band_id')
      .notNull()
      .references(() => band.id, { onDelete: 'cascade' }),
    day: date('day', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('band_availability_band_day').on(t.bandId, t.day)],
)

// Jour occupé dans l'agenda perso d'un musicien : il bloque ce soir-là pour tous ses groupes.
// La note n'est visible que de son auteur ; les autres voient seulement « occupé ».
export const unavailability = pgTable(
  'unavailability',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    day: date('day', { mode: 'string' }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('unavailability_user_day').on(t.userId, t.day)],
)

// Période de tournée d'un groupe : les orgas de la région voient qu'il passe près de chez eux.
export const tour = pgTable(
  'tour',
  {
    id: text('id').primaryKey(),
    bandId: text('band_id')
      .notNull()
      .references(() => band.id, { onDelete: 'cascade' }),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }).notNull(),
    region: text('region').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tour_band_idx').on(t.bandId)],
)

/* ---------- Dates à pourvoir et candidatures ---------- */

// Date publiée par une orga. Sans lieu choisi, on reprend la ville et la capacité de l'orga.
export const gig = pgTable(
  'gig',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    venueId: text('venue_id').references(() => venue.id, { onDelete: 'set null' }),
    day: date('day', { mode: 'string' }).notNull(),
    loadIn: text('load_in'),
    setStart: text('set_start'),
    curfew: text('curfew'),
    // Dates créées ensemble par la répétition (chaque semaine, chaque mois)
    seriesId: text('series_id'),
    genres: text('genres').array().notNull().default([]),
    // headline (tête d'affiche) | support (1re partie) | bill (plateau)
    format: text('format').notNull(),
    bandsCount: integer('bands_count').notNull().default(1),
    setLength: integer('set_length'),
    budgetMin: integer('budget_min'),
    budgetMax: integer('budget_max'),
    // meal | drinks | lodging | travel
    includes: text('includes').array().notNull().default([]),
    // open (annonce ouverte : les groupes candidatent) | invite (seuls les groupes contactés la voient)
    visibility: text('visibility').notNull().default('open'),
    note: text('note'),
    // open | filled (show calé, étape 7) | cancelled
    status: text('status').notNull().default('open'),
    ...timestamps,
  },
  (t) => [index('gig_org_idx').on(t.organizationId), index('gig_day_idx').on(t.day)],
)

// Candidature d'un groupe à une date en annonce ouverte.
export const application = pgTable(
  'application',
  {
    id: text('id').primaryKey(),
    gigId: text('gig_id')
      .notNull()
      .references(() => gig.id, { onDelete: 'cascade' }),
    bandId: text('band_id')
      .notNull()
      .references(() => band.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    message: text('message'),
    fee: integer('fee'),
    // pending | declined (par l'orga) | withdrawn (par le groupe) | cancelled (date annulée)
    status: text('status').notNull().default('pending'),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('application_gig_band').on(t.gigId, t.bandId),
    index('application_band_idx').on(t.bandId),
  ],
)

export const userRelations = relations(user, ({ many, one }) => ({
  organizations: many(organization),
  memberships: many(bandMember),
  musician: one(musician, { fields: [user.id], references: [musician.userId] }),
}))

export const bandRelations = relations(band, ({ many }) => ({
  members: many(bandMember),
  applications: many(application),
}))

export const bandMemberRelations = relations(bandMember, ({ one }) => ({
  band: one(band, { fields: [bandMember.bandId], references: [band.id] }),
  user: one(user, { fields: [bandMember.userId], references: [user.id] }),
}))

export const organizationRelations = relations(organization, ({ one, many }) => ({
  owner: one(user, { fields: [organization.ownerId], references: [user.id] }),
  venues: many(venue),
  gigs: many(gig),
}))

export const gigRelations = relations(gig, ({ one, many }) => ({
  organization: one(organization, {
    fields: [gig.organizationId],
    references: [organization.id],
  }),
  venue: one(venue, { fields: [gig.venueId], references: [venue.id] }),
  applications: many(application),
}))

export const applicationRelations = relations(application, ({ one }) => ({
  gig: one(gig, { fields: [application.gigId], references: [gig.id] }),
  band: one(band, { fields: [application.bandId], references: [band.id] }),
}))

export const venueRelations = relations(venue, ({ one }) => ({
  organization: one(organization, {
    fields: [venue.organizationId],
    references: [organization.id],
  }),
}))

export const musicianRelations = relations(musician, ({ one }) => ({
  user: one(user, { fields: [musician.userId], references: [user.id] }),
}))
