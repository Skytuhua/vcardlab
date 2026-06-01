// Duplicate detection and merging. A "match key" is built per the selected strategy;
// contacts sharing any key are grouped (transitively) and can be merged into one.

import {
  type Address,
  type Contact,
  type TypedValue,
  displayName,
  emptyName,
} from './model'

export interface MatchOptions {
  byPhone: boolean
  byEmail: boolean
  byName: boolean
}

export const defaultMatchOptions: MatchOptions = { byPhone: true, byEmail: true, byName: false }

/** Normalize a phone to its comparison form: digits only, last 10 if longer. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

function normalizeName(c: Contact): string {
  return displayName(c).trim().toLowerCase().replace(/\s+/g, ' ')
}

function keysFor(c: Contact, opts: MatchOptions): string[] {
  const keys: string[] = []
  if (opts.byEmail) {
    for (const e of c.emails) {
      const v = e.value.trim().toLowerCase()
      if (v) keys.push('e:' + v)
    }
  }
  if (opts.byPhone) {
    for (const p of c.phones) {
      const v = normalizePhone(p.value)
      if (v) keys.push('p:' + v)
    }
  }
  if (opts.byName) {
    const n = normalizeName(c)
    if (n && n !== '(no name)') keys.push('n:' + n)
  }
  return keys
}

/** A group of contacts considered duplicates of each other. */
export interface DuplicateGroup {
  ids: string[]
  contacts: Contact[]
}

/** Find duplicate groups (size >= 2) using union-find over shared match keys. */
export function findDuplicates(contacts: Contact[], opts: MatchOptions): DuplicateGroup[] {
  const parent = new Map<string, string>()
  const find = (x: string): string => {
    let root = x
    while (parent.get(root) !== root) root = parent.get(root)!
    // Path compression.
    let cur = x
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!
      parent.set(cur, root)
      cur = next
    }
    return root
  }
  const union = (a: string, b: string) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  for (const c of contacts) parent.set(c.id, c.id)

  // Map each key to the first contact that owns it; union subsequent owners.
  const keyOwner = new Map<string, string>()
  for (const c of contacts) {
    for (const k of keysFor(c, opts)) {
      const owner = keyOwner.get(k)
      if (owner === undefined) keyOwner.set(k, c.id)
      else union(owner, c.id)
    }
  }

  const byId = new Map(contacts.map((c) => [c.id, c]))
  const groups = new Map<string, string[]>()
  for (const c of contacts) {
    const root = find(c.id)
    const arr = groups.get(root) ?? []
    arr.push(c.id)
    groups.set(root, arr)
  }

  const result: DuplicateGroup[] = []
  for (const ids of groups.values()) {
    if (ids.length >= 2) {
      result.push({ ids, contacts: ids.map((id) => byId.get(id)!) })
    }
  }
  // Largest groups first for review.
  result.sort((a, b) => b.ids.length - a.ids.length)
  return result
}

function mergeTyped(a: TypedValue[], b: TypedValue[]): TypedValue[] {
  const out: TypedValue[] = [...a]
  for (const item of b) {
    const existing = out.find((x) => x.value.trim().toLowerCase() === item.value.trim().toLowerCase())
    if (existing) {
      // Union the types.
      for (const t of item.types) if (!existing.types.includes(t)) existing.types.push(t)
    } else {
      out.push({ value: item.value, types: [...item.types] })
    }
  }
  return out
}

function sameAddress(a: Address, b: Address): boolean {
  return (
    a.street === b.street &&
    a.locality === b.locality &&
    a.postal === b.postal &&
    a.country === b.country
  )
}

/** Merge a set of duplicate contacts into one, taking the union of all fields. */
export function mergeContacts(group: Contact[]): Contact {
  if (group.length === 0) throw new Error('mergeContacts: empty group')
  const base = group[0]
  const merged: Contact = {
    id: base.id,
    fn: base.fn,
    n: base.n ? { ...base.n } : emptyName(),
    nickname: base.nickname,
    org: base.org ? [...base.org] : undefined,
    title: base.title,
    emails: [...base.emails.map((e) => ({ ...e, types: [...e.types] }))],
    phones: [...base.phones.map((p) => ({ ...p, types: [...p.types] }))],
    addresses: [...base.addresses.map((a) => ({ ...a }))],
    urls: [...base.urls.map((u) => ({ ...u, types: [...u.types] }))],
    birthday: base.birthday,
    note: base.note,
    photo: base.photo ?? null,
    categories: [...base.categories],
    extra: [...base.extra],
    sourceVersion: base.sourceVersion,
  }

  for (let i = 1; i < group.length; i++) {
    const c = group[i]
    if (!merged.fn && c.fn) merged.fn = c.fn
    // Prefer a more complete structured name.
    if (c.n) {
      const score = (n: typeof c.n) => [n.family, n.given, n.additional].filter(Boolean).length
      if (!merged.n || score(c.n) > score(merged.n)) merged.n = { ...c.n }
    }
    if (!merged.nickname && c.nickname) merged.nickname = c.nickname
    if ((!merged.org || !merged.org.length) && c.org && c.org.length) merged.org = [...c.org]
    if (!merged.title && c.title) merged.title = c.title
    merged.emails = mergeTyped(merged.emails, c.emails)
    merged.phones = mergeTyped(merged.phones, c.phones)
    merged.urls = mergeTyped(merged.urls, c.urls)
    for (const a of c.addresses) {
      if (!merged.addresses.some((x) => sameAddress(x, a))) merged.addresses.push({ ...a })
    }
    if (!merged.birthday && c.birthday) merged.birthday = c.birthday
    if (c.note) merged.note = merged.note ? merged.note + (merged.note.includes(c.note) ? '' : '\n' + c.note) : c.note
    if (!merged.photo && c.photo) merged.photo = c.photo
    for (const cat of c.categories) if (!merged.categories.includes(cat)) merged.categories.push(cat)
    merged.extra.push(...c.extra)
  }
  return merged
}

/**
 * Merge every duplicate group in `contacts`, returning a new list where each group is
 * collapsed into a single merged contact and order is otherwise preserved.
 */
export function mergeAllDuplicates(contacts: Contact[], opts: MatchOptions): Contact[] {
  const groups = findDuplicates(contacts, opts)
  if (groups.length === 0) return contacts
  const removed = new Set<string>()
  const replacement = new Map<string, Contact>()
  for (const g of groups) {
    const merged = mergeContacts(g.contacts)
    replacement.set(g.contacts[0].id, merged)
    for (let i = 1; i < g.contacts.length; i++) removed.add(g.contacts[i].id)
  }
  const out: Contact[] = []
  for (const c of contacts) {
    if (removed.has(c.id)) continue
    out.push(replacement.get(c.id) ?? c)
  }
  return out
}
