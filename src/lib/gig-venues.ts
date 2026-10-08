import 'server-only'
import { getTranslations } from 'next-intl/server'

// Lieux de l'orga pour le formulaire de date, avec le matériel fourni en clair.
export async function venuesForForm(
  venues: {
    id: string
    name: string
    city: string
    capacity: number | null
    paProvided: boolean
    lightsProvided: boolean
    engineerOnSite: boolean
    backline: string | null
  }[],
) {
  const t = await getTranslations('gigs.detail.gearItems')
  return venues.map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    capacity: v.capacity,
    gear: [
      v.paProvided && t('pa'),
      v.lightsProvided && t('lights'),
      v.engineerOnSite && t('engineer'),
      v.backline,
    ].filter((x): x is string => Boolean(x)),
  }))
}
