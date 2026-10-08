import { describe, expect, it } from 'vitest'

import en from '../../messages/en.json'
import fr from '../../messages/fr.json'

type Tree = { [key: string]: Tree | string | string[] }

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'string') return [path]
    if (Array.isArray(v)) return [`${path}[${v.length}]`]
    return keys(v, path)
  })
}

describe('traductions', () => {
  it('fr et en ont exactement les mêmes clés', () => {
    expect(keys(en as Tree).sort()).toEqual(keys(fr as Tree).sort())
  })

  it('aucun texte vide', () => {
    for (const tree of [fr, en]) {
      const empty = keys(tree as Tree).filter((k) => {
        const v = k
          .split('.')
          .reduce<unknown>((o, p) => (o as Tree)[p.replace(/\[\d+\]$/, '')], tree)
        return typeof v === 'string' && v.trim() === ''
      })
      expect(empty).toEqual([])
    }
  })
})
