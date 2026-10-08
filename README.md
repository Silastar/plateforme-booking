# Plateforme booking (nom provisoire)

Mise en relation entre orgas (salles, bars, festivals) et groupes / musiciens. Next.js 16, PostgreSQL 17, FR/EN.

## Lancer

- Image : `docker build -t plateforme-booking:dev -f Dockerfile .` (le build lance types, lint, formatage et tests).
- Base : conteneur `postgres:17-alpine` sur le réseau Docker `plateforme-booking`.
- Variable obligatoire : `DATABASE_URL=postgres://booking:…@plateforme-booking-db:5432/booking`.
- Santé : `GET /api/health` → `{ ok: true, db: "up" }`.

## Développer

- `npm run check` : types + lint + formatage + tests.
- Textes : `messages/fr.json` et `messages/en.json` (mêmes clés, vérifié par un test). Adresses traduites dans `src/i18n/routing.ts`.
- Couleurs et polices du thème : `src/styles/globals.css`.
