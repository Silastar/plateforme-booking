// Adresse lisible d'un profil : « Les Néons Fauves » → « les-neons-fauves ».
export function slugify(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  return s || 'profil'
}

export async function uniqueSlug(base: string, taken: (slug: string) => Promise<boolean>) {
  const root = slugify(base)
  if (!(await taken(root))) return root
  for (let i = 2; i < 1000; i++) {
    const candidate = `${root}-${i}`
    if (!(await taken(candidate))) return candidate
  }
  return `${root}-${Date.now()}`
}
