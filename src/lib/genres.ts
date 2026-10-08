// Liste fixe des genres (cahier des charges : liste fixe + tags libres plus tard).
export const GENRES = [
  'rock',
  'punk',
  'jazz',
  'electro',
  'folk',
  'metal',
  'blues',
  'hiphop',
  'garage',
  'reggae',
  'stoner',
  'chanson',
] as const

export type Genre = (typeof GENRES)[number]

// Genres proposés dans la recherche rapide de l'accueil.
export const SEARCH_GENRES: Genre[] = ['rock', 'punk', 'jazz', 'electro', 'metal', 'folk']
