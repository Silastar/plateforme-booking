// Lecture d'un FormData vers un objet simple, avant validation par zod.
export function readForm(fd: FormData, fields: Record<string, 'text' | 'bool' | 'list'>) {
  const out: Record<string, unknown> = {}
  for (const [key, kind] of Object.entries(fields)) {
    if (kind === 'bool') out[key] = fd.get(key) === 'on' || fd.get(key) === 'true'
    else if (kind === 'list') out[key] = fd.getAll(key).map(String).filter(Boolean)
    else out[key] = String(fd.get(key) ?? '')
  }
  return out
}

// Champ texte facultatif : chaîne vide → null en base.
export const orNull = <T>(v: T | '' | undefined): T | null =>
  v === '' || v === undefined ? null : v
