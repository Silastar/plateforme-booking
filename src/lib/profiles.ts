import 'server-only'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

import { db } from '@/db'
import { band, bandMember, musician, organization, user } from '@/db/schema'

import type { ProfileInput } from './validation'

// Crée le profil choisi à l'inscription et fixe le rôle du compte.
// Les orgas restent « pending » jusqu'à la validation par l'équipe (cahier des charges).
export async function createProfile(userId: string, profile: ProfileInput) {
  await db.transaction(async (tx) => {
    if (profile.role === 'orga') {
      await tx.insert(organization).values({
        id: randomUUID(),
        ownerId: userId,
        name: profile.name,
        type: profile.type,
        city: profile.city,
        capacity: profile.capacity ?? null,
        website: profile.website || null,
      })
    } else if (profile.role === 'groupe') {
      const bandId = randomUUID()
      await tx.insert(band).values({
        id: bandId,
        name: profile.name,
        mainGenre: profile.mainGenre,
        city: profile.city,
        musiciansCount: profile.musiciansCount ?? null,
        listenUrl: profile.listenUrl,
      })
      // Celui qui inscrit le groupe en devient l'admin.
      await tx.insert(bandMember).values({ bandId, userId, isAdmin: true, isEssential: true })
    } else {
      await tx.insert(musician).values({
        userId,
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
