import { defineRouting } from 'next-intl/routing'

// Adresses traduites : /fr/groupes ↔ /en/bands. Les pages pas encore construites renvoient une 404.
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  pathnames: {
    '/': '/',
    '/groupes': { fr: '/groupes', en: '/bands' },
    '/dates': { fr: '/dates-ouvertes', en: '/open-dates' },
    '/dates/[id]': { fr: '/dates-ouvertes/[id]', en: '/open-dates/[id]' },
    '/orgas': { fr: '/orgas', en: '/promoters' },
    '/groupes/[slug]': { fr: '/groupes/[slug]', en: '/bands/[slug]' },
    '/orgas/[slug]': { fr: '/orgas/[slug]', en: '/promoters/[slug]' },
    '/musiciens/[slug]': { fr: '/musiciens/[slug]', en: '/musicians/[slug]' },
    '/compte/groupe/[id]': { fr: '/compte/groupe/[id]', en: '/account/band/[id]' },
    '/compte/groupe/[id]/calendrier': {
      fr: '/compte/groupe/[id]/calendrier',
      en: '/account/band/[id]/calendar',
    },
    '/compte/musicien/agenda': { fr: '/compte/musicien/agenda', en: '/account/musician/calendar' },
    '/compte/orga': { fr: '/compte/orga', en: '/account/promoter' },
    '/compte/dates': { fr: '/compte/dates', en: '/account/dates' },
    '/compte/dates/nouvelle': { fr: '/compte/dates/nouvelle', en: '/account/dates/new' },
    '/compte/dates/[id]': { fr: '/compte/dates/[id]', en: '/account/dates/[id]' },
    '/compte/musicien': { fr: '/compte/musicien', en: '/account/musician' },
    '/tarifs': { fr: '/tarifs', en: '/pricing' },
    '/inscription': { fr: '/inscription', en: '/signup' },
    '/inscription/profil': { fr: '/inscription/profil', en: '/signup/profile' },
    '/compte': { fr: '/compte', en: '/account' },
    '/mot-de-passe-oublie': { fr: '/mot-de-passe-oublie', en: '/forgot-password' },
    '/nouveau-mot-de-passe': { fr: '/nouveau-mot-de-passe', en: '/reset-password' },
    '/connexion': { fr: '/connexion', en: '/login' },
    '/conditions': { fr: '/conditions', en: '/terms' },
    '/confidentialite': { fr: '/confidentialite', en: '/privacy' },
    '/contact': '/contact',
  },
})

export type Locale = (typeof routing.locales)[number]
