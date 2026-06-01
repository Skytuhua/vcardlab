// Splitting helpers: chunk contacts into N-per-file groups and build safe filenames.

import { type Contact, displayName } from './model'

/** Split an array into chunks of at most `size`. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) throw new Error('chunk size must be >= 1')
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

/** Produce a filesystem-safe slug from a contact's display name. */
export function contactSlug(c: Contact, index: number): string {
  const name = displayName(c)
  const slug = name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60)
  const padded = String(index + 1).padStart(4, '0')
  return slug ? `${padded}_${slug}` : `${padded}_contact`
}

/** Ensure filenames are unique within a batch by appending a counter on collisions. */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((n) => {
    const count = seen.get(n) ?? 0
    seen.set(n, count + 1)
    return count === 0 ? n : `${n}_${count + 1}`
  })
}
