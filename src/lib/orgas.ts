import 'server-only'
import { asc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { organization, venue } from '@/db/schema'

export async function getOrgaForEdit(userId: string) {
  return (
    (await db.query.organization.findFirst({
      where: eq(organization.ownerId, userId),
      with: { venues: { orderBy: [asc(venue.createdAt)] } },
    })) ?? null
  )
}

export async function getOrgaPage(slug: string) {
  return (
    (await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
      with: { owner: true, venues: { orderBy: [asc(venue.createdAt)] } },
    })) ?? null
  )
}
