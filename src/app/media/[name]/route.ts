import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { MEDIA_NAME, UPLOAD_DIR } from '@/lib/uploads'

// Sert les photos et fiches techniques envoyées (noms aléatoires, contenu jamais modifié ensuite).
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  if (!MEDIA_NAME.test(name)) return new Response('Not found', { status: 404 })
  try {
    const body = await readFile(path.join(UPLOAD_DIR, name))
    return new Response(body, {
      headers: {
        'Content-Type': name.endsWith('.pdf') ? 'application/pdf' : 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
        ...(name.endsWith('.pdf') ? { 'Content-Disposition': 'inline' } : {}),
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
