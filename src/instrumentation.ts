export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { runMigrations } = await import('./db/migrate')
  await runMigrations()
  // Géolocalisation des profils qui n'en ont pas encore, sans retarder le démarrage.
  const { backfillGeo } = await import('./lib/geocode')
  void backfillGeo().catch((e) => console.warn('[geo]', e))
}
