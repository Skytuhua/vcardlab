// Cleaning / repair operations on the working set. Each returns a new array and never mutates.

import { type Contact } from './model'

/** Remove embedded photos from every contact (privacy + file size). */
export function stripPhotos(contacts: Contact[]): Contact[] {
  return contacts.map((c) => (c.photo ? { ...c, photo: null } : c))
}

/** Drop contacts that carry no usable identifying information. */
export function dropEmpty(contacts: Contact[]): Contact[] {
  return contacts.filter(
    (c) =>
      c.fn ||
      (c.n && (c.n.family || c.n.given)) ||
      (c.org && c.org.some(Boolean)) ||
      c.emails.length ||
      c.phones.length ||
      c.addresses.length,
  )
}

function trimStr<T extends string | undefined>(v: T): T {
  return (typeof v === 'string' ? v.trim() : v) as T
}

/** Trim stray whitespace from text fields and values across all contacts. */
export function trimWhitespace(contacts: Contact[]): Contact[] {
  return contacts.map((c) => ({
    ...c,
    fn: trimStr(c.fn),
    title: trimStr(c.title),
    nickname: trimStr(c.nickname),
    note: trimStr(c.note),
    org: c.org?.map((o) => o.trim()),
    emails: c.emails.map((e) => ({ ...e, value: e.value.trim() })),
    phones: c.phones.map((p) => ({ ...p, value: p.value.trim() })),
    urls: c.urls.map((u) => ({ ...u, value: u.value.trim() })),
  }))
}

/**
 * Normalize phone display formatting: collapse internal whitespace and unify separators
 * while preserving a leading "+". Keeps digits, "+", and grouping spaces only.
 */
export function normalizePhoneFormatting(contacts: Contact[]): Contact[] {
  const fmt = (raw: string): string => {
    const trimmed = raw.trim()
    const plus = trimmed.startsWith('+')
    const digits = trimmed.replace(/[^\d]/g, '')
    if (!digits) return trimmed
    return (plus ? '+' : '') + digits
  }
  return contacts.map((c) => ({
    ...c,
    phones: c.phones.map((p) => ({ ...p, value: fmt(p.value) })),
  }))
}

/**
 * Repair "mojibake" — text that was UTF-8 but got decoded as Latin-1/Windows-1252,
 * producing sequences like "Ã©" for "é". Attempts a safe round-trip and only keeps the
 * result if it actually reduces those tell-tale sequences.
 */
export function repairMojibake(contacts: Contact[]): Contact[] {
  const looksMojibake = (s: string) => /Ã.|Â.|â€|Ã¢/.test(s)
  const fix = (s: string | undefined): string | undefined => {
    if (!s || !looksMojibake(s)) return s
    try {
      // Re-interpret the string's chars as Latin-1 bytes, then decode as UTF-8.
      const bytes = Uint8Array.from([...s].map((ch) => ch.charCodeAt(0) & 0xff))
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      // Only accept if it no longer looks like mojibake and has no replacement chars.
      if (!looksMojibake(decoded) && !decoded.includes('�')) return decoded
    } catch {
      /* fall through */
    }
    return s
  }
  return contacts.map((c) => ({
    ...c,
    fn: fix(c.fn),
    title: fix(c.title),
    nickname: fix(c.nickname),
    note: fix(c.note),
    org: c.org?.map((o) => fix(o) ?? o),
    n: c.n
      ? {
          family: fix(c.n.family) ?? c.n.family,
          given: fix(c.n.given) ?? c.n.given,
          additional: fix(c.n.additional) ?? c.n.additional,
          prefix: fix(c.n.prefix) ?? c.n.prefix,
          suffix: fix(c.n.suffix) ?? c.n.suffix,
        }
      : c.n,
    addresses: c.addresses.map((a) => ({
      ...a,
      street: fix(a.street) ?? a.street,
      locality: fix(a.locality) ?? a.locality,
      region: fix(a.region) ?? a.region,
      country: fix(a.country) ?? a.country,
    })),
  }))
}
