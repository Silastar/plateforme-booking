import 'server-only'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

import { db } from '@/db'
import { band, bandMember, musician, organization, user } from '@/db/schema'

import { uniqueSlug } from './slug'
import type { ProfileInput } from './validation'

// Crée le profil choisi à l'inscription et fixe le rôle du compte.
// Les orgas restent « pending » jusqu'à la validation par l'équipe (cahier des charges).
export async function createProfile(userId: string, profile: ProfileInput) {
  await db.transaction(async (tx) => {
    if (profile.role === 'orga') {
      const slug = await uniqueSlug(profile.name, async (s) =>
        Boolean(await tx.query.organization.findFirst({ where: eq(organization.slug, s) })),
      )
      await tx.insert(organization).values({
        id: randomUUID(),
        slug,
        ownerId: userId,
        name: profile.name,
        type: profile.type,
        city: profile.city,
        capacity: profile.capacity ?? null,
        website: profile.website || null,
      })
    } else if (profile.role === 'groupe') {
      const bandId = randomUUID()
      const slug = await uniqueSlug(profile.name, async (s) =>
        Boolean(await tx.query.band.findFirst({ where: eq(band.slug, s) })),
      )
      await tx.insert(band).values({
        id: bandId,
        slug,
        name: profile.name,
        mainGenre: profile.mainGenre,
        city: profile.city,
        musiciansCount: profile.musiciansCount ?? null,
        listenUrl: profile.listenUrl,
      })
      // Celui qui inscrit le groupe en devient l'admin.
      await tx
        .insert(bandMember)
        .values({ id: randomUUID(), bandId, userId, isAdmin: true, isEssential: true })
    } else {
      const slug = await uniqueSlug(profile.stageName, async (s) =>
        Boolean(await tx.query.musician.findFirst({ where: eq(musician.slug, s) })),
      )
      await tx.insert(musician).values({
        userId,
        slug,
        stageName: profile.stageName,
        mainInstrument: profile.mainInstrument,
        otherInstruments: profile.otherInstruments || null,
        city: profile.city,
        level: profile.level,
        availableForSubs: profile.availableForSubs ?? false,
      })
    }
    await tx
      .update(user)
      .set({ role: profile.role, status: profile.role === 'orga' ? 'pending' : 'active' })
      .where(eq(user.id, userId))
  })
}
