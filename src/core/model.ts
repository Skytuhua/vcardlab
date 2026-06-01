// Core data model for vcardlab. Framework-free, no DOM — safe to unit-test in isolation.

export type VCardVersion = '2.1' | '3.0' | '4.0' | 'unknown'

/** A value that carries a set of TYPE parameters, e.g. a phone or email. */
export interface TypedValue {
  value: string
  types: string[]
}

/** Structured name (vCard `N`): Family;Given;Additional;Prefix;Suffix. */
export interface StructuredName {
  family: string
  given: string
  additional: string
  prefix: string
  suffix: string
}

/** Structured address (vCard `ADR`). */
export interface Address {
  types: string[]
  poBox: string
  ext: string
  street: string
  locality: string
  region: string
  postal: string
  country: string
}

/** Embedded or referenced photo. `data` is either a data: URI, a URL, or raw base64. */
export interface Photo {
  /** Original raw value (base64 payload or URI). */
  data: string
  /** Media type if known, e.g. "JPEG", "image/png". */
  mediaType?: string
  /** True when `data` is a remote/URI reference rather than inline bytes. */
  isUri: boolean
}

/** A property we don't explicitly model — preserved verbatim so round-trips are lossless. */
export interface RawProperty {
  group?: string
  name: string
  /** Parameter list as [key, value] pairs (key uppercased; TYPE values flattened). */
  params: Array<[string, string]>
  /** Decoded value string. */
  value: string
}

export interface Contact {
  /** Stable local id (never persisted server-side; local only). */
  id: string
  fn?: string
  n?: StructuredName
  nickname?: string
  org?: string[]
  title?: string
  emails: TypedValue[]
  phones: TypedValue[]
  addresses: Address[]
  urls: TypedValue[]
  birthday?: string
  note?: string
  photo?: Photo | null
  categories: string[]
  /** Unmodeled properties, preserved verbatim. */
  extra: RawProperty[]
  sourceVersion: VCardVersion
}

/** A non-fatal problem encountered while parsing. */
export interface ParseWarning {
  /** 1-based index of the card within the file (or 0 if not card-specific). */
  card: number
  message: string
}

export interface ParseResult {
  contacts: Contact[]
  warnings: ParseWarning[]
}

export function emptyName(): StructuredName {
  return { family: '', given: '', additional: '', prefix: '', suffix: '' }
}

/** Best human-readable display name for a contact. */
export function displayName(c: Contact): string {
  if (c.fn && c.fn.trim()) return c.fn.trim()
  if (c.n) {
    const parts = [c.n.prefix, c.n.given, c.n.additional, c.n.family, c.n.suffix]
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length) return parts.join(' ')
  }
  if (c.org && c.org.length && c.org[0]) return c.org[0]
  if (c.emails.length) return c.emails[0].value
  if (c.phones.length) return c.phones[0].value
  return '(no name)'
}
