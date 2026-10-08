// Lecteurs intégrés : on ne transforme que les liens connus, le reste reste un simple lien.
export type Embed = { kind: 'spotify' | 'youtube' | 'soundcloud'; src: string; height: number }

export function embedFor(url: string | null | undefined): Embed | null {
  if (!url) return null
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  const host = u.hostname.replace(/^www\./, '')

  if (host === 'open.spotify.com') {
    const m = u.pathname.match(
      /^\/(?:intl-[a-z-]+\/)?(track|album|artist|playlist)\/([A-Za-z0-9]+)/,
    )
    if (!m) return null
    return {
      kind: 'spotify',
      src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
      height: m[1] === 'track' ? 152 : 352,
    }
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    let id: string | null = null
    if (host === 'youtu.be') id = u.pathname.slice(1)
    else if (u.pathname === '/watch') id = u.searchParams.get('v')
    else id = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? null
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null
    // youtube-nocookie : pas de cookie de suivi avant la lecture.
    return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}`, height: 315 }
  }

  if (host === 'soundcloud.com') {
    if (u.pathname.split('/').filter(Boolean).length < 1) return null
    const params = new URLSearchParams({
      url: `https://soundcloud.com${u.pathname}`,
      color: '#c81e1e',
    })
    return { kind: 'soundcloud', src: `https://w.soundcloud.com/player/?${params}`, height: 166 }
  }

  return null
}
