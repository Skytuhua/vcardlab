// vCard parser supporting versions 2.1, 3.0 and 4.0. Tolerant of malformed input:
// a bad card produces a warning and is skipped, never an exception that breaks the app.

import {
  type Contact,
  type ParseResult,
  type ParseWarning,
  type Photo,
  type RawProperty,
  type TypedValue,
  type VCardVersion,
  emptyName,
} from './model'
import { decodeQuotedPrintable } from './quotedPrintable'

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `c${Date.now().toString(36)}_${idCounter}`
}

/** Split on a separator, honouring backslash escapes (`\;`, `\,`). */
function splitEscaped(value: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\' && i + 1 < value.length) {
      cur += ch + value[i + 1]
      i++
      continue
    }
    if (ch === sep) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

/** Unescape vCard text escapes within a single component. */
function unescape(value: string): string {
  let out = ''
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (ch === '\\' && i + 1 < value.length) {
      const n = value[i + 1]
      if (n === 'n' || n === 'N') out += '\n'
      else if (n === ',') out += ','
      else if (n === ';') out += ';'
      else if (n === '\\') out += '\\'
      else out += n
      i++
    } else {
      out += ch
    }
  }
  return out
}

interface ParsedLine {
  group?: string
  name: string
  params: Map<string, string[]>
  rawValue: string
}

/** Find the index of the first colon not inside a double-quoted parameter value. */
function firstUnquotedColon(line: string): number {
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') inQuote = !inQuote
    else if (ch === ':' && !inQuote) return i
  }
  return -1
}

/** Split a `;`-separated header honouring quoted parameter values. */
function splitHeader(header: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < header.length; i++) {
    const ch = header[i]
    if (ch === '"') {
      inQuote = !inQuote
      cur += ch
    } else if (ch === ';' && !inQuote) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

function parseLine(line: string): ParsedLine | null {
  const colon = firstUnquotedColon(line)
  if (colon === -1) return null
  const header = line.slice(0, colon)
  const rawValue = line.slice(colon + 1)
  const segments = splitHeader(header)
  if (segments.length === 0 || !segments[0]) return null

  let nameToken = segments[0].trim()
  let group: string | undefined
  const dot = nameToken.indexOf('.')
  if (dot > 0) {
    group = nameToken.slice(0, dot)
    nameToken = nameToken.slice(dot + 1)
  }
  const name = nameToken.toUpperCase()

  const params = new Map<string, string[]>()
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i].trim()
    if (!seg) continue
    const eq = seg.indexOf('=')
    if (eq === -1) {
      // vCard 2.1 bare parameter (e.g. ";HOME;CELL") → treat as a TYPE value.
      addParam(params, 'TYPE', seg)
    } else {
      const key = seg.slice(0, eq).trim().toUpperCase()
      const valuePart = seg.slice(eq + 1).trim()
      // A param value may itself be comma-separated and/or quoted.
      for (const v of valuePart.split(',')) {
        addParam(params, key, v.replace(/^"|"$/g, '').trim())
      }
    }
  }
  return { group, name, params, rawValue }
}

function addParam(params: Map<string, string[]>, key: string, value: string) {
  if (!value) return
  const arr = params.get(key) ?? []
  arr.push(value)
  params.set(key, arr)
}

function getTypes(params: Map<string, string[]>): string[] {
  return (params.get('TYPE') ?? []).map((t) => t.toUpperCase()).filter((t) => t !== 'PREF')
}

/**
 * Assemble physical lines into logical (unfolded) lines, handling both standard
 * whitespace folding and vCard 2.1 quoted-printable soft line breaks (`=` at EOL).
 */
function unfold(text: string): string[] {
  const physical = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const logical: string[] = []
  for (let i = 0; i < physical.length; i++) {
    let line = physical[i]
    // Standard folding: a following line starting with space/tab is a continuation.
    while (i + 1 < physical.length && /^[ \t]/.test(physical[i + 1])) {
      line += physical[i + 1].slice(1)
      i++
    }
    // Quoted-printable soft breaks: line is QP-encoded and ends with '='.
    while (/quoted-printable/i.test(line) && /=\s*$/.test(line) && i + 1 < physical.length) {
      line = line.replace(/=\s*$/, '') + physical[i + 1]
      i++
    }
    logical.push(line)
  }
  return logical
}

function decodeValue(parsed: ParsedLine): string {
  const enc = (parsed.params.get('ENCODING') ?? []).map((e) => e.toUpperCase())
  const charset = (parsed.params.get('CHARSET') ?? [])[0]
  if (enc.includes('QUOTED-PRINTABLE')) {
    return decodeQuotedPrintable(parsed.rawValue, charset)
  }
  return parsed.rawValue
}

function applyProperty(contact: Contact, p: ParsedLine, warnings: ParseWarning[], cardIdx: number) {
  const value = decodeValue(p)
  switch (p.name) {
    case 'VERSION': {
      const v = value.trim()
      if (v === '2.1' || v === '3.0' || v === '4.0') contact.sourceVersion = v as VCardVersion
      break
    }
    case 'FN':
      contact.fn = unescape(value)
      break
    case 'N': {
      const parts = splitEscaped(value, ';').map(unescape)
      contact.n = {
        family: parts[0] ?? '',
        given: parts[1] ?? '',
        additional: parts[2] ?? '',
        prefix: parts[3] ?? '',
        suffix: parts[4] ?? '',
      }
      break
    }
    case 'NICKNAME':
      contact.nickname = splitEscaped(value, ',').map(unescape).join(', ')
      break
    case 'ORG':
      contact.org = splitEscaped(value, ';').map(unescape)
      break
    case 'TITLE':
      contact.title = unescape(value)
      break
    case 'EMAIL':
      pushTyped(contact.emails, unescape(value), getTypes(p.params))
      break
    case 'TEL':
      pushTyped(contact.phones, unescape(value), getTypes(p.params))
      break
    case 'URL':
      pushTyped(contact.urls, unescape(value), getTypes(p.params))
      break
    case 'ADR': {
      const parts = splitEscaped(value, ';').map(unescape)
      contact.addresses.push({
        types: getTypes(p.params),
        poBox: parts[0] ?? '',
        ext: parts[1] ?? '',
        street: parts[2] ?? '',
        locality: parts[3] ?? '',
        region: parts[4] ?? '',
        postal: parts[5] ?? '',
        country: parts[6] ?? '',
      })
      break
    }
    case 'BDAY':
      contact.birthday = value.trim()
      break
    case 'NOTE':
      contact.note = unescape(value)
      break
    case 'CATEGORIES':
      contact.categories.push(...splitEscaped(value, ',').map(unescape).filter(Boolean))
      break
    case 'PHOTO':
    case 'LOGO': {
      contact.photo = parsePhoto(p, value)
      break
    }
    case 'BEGIN':
    case 'END':
      break
    default:
      contact.extra.push(toRaw(p, value))
  }
  void warnings
  void cardIdx
}

function parsePhoto(p: ParsedLine, value: string): Photo {
  const enc = (p.params.get('ENCODING') ?? []).map((e) => e.toUpperCase())
  const types = p.params.get('TYPE') ?? []
  const valueParam = (p.params.get('VALUE') ?? []).map((v) => v.toUpperCase())
  const isInlineBase64 = enc.includes('B') || enc.includes('BASE64')
  const looksLikeUri = /^https?:|^data:/i.test(value.trim())
  if (looksLikeUri && !isInlineBase64 && !valueParam.includes('BINARY')) {
    return { data: value.trim(), isUri: true, mediaType: types[0] }
  }
  return { data: value.replace(/\s+/g, ''), isUri: false, mediaType: types[0] }
}

function toRaw(p: ParsedLine, value: string): RawProperty {
  const params: Array<[string, string]> = []
  for (const [k, vals] of p.params) for (const v of vals) params.push([k, v])
  return { group: p.group, name: p.name, params, value }
}

function pushTyped(arr: TypedValue[], value: string, types: string[]) {
  if (!value.trim()) return
  arr.push({ value: value.trim(), types })
}

function newContact(): Contact {
  return {
    id: nextId(),
    emails: [],
    phones: [],
    addresses: [],
    urls: [],
    categories: [],
    extra: [],
    sourceVersion: 'unknown',
  }
}

/** Parse a vCard file (which may contain many cards) into contacts + warnings. */
export function parseVcf(text: string): ParseResult {
  const lines = unfold(text)
  const contacts: Contact[] = []
  const warnings: ParseWarning[] = []
  let current: Contact | null = null
  let cardIdx = 0
  let depth = 0

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    const upper = line.toUpperCase()
    if (upper.startsWith('BEGIN:VCARD')) {
      cardIdx += 1
      if (current && depth > 0) {
        // Nested BEGIN without END — finalise the previous card defensively.
        finalize(current, contacts, warnings, cardIdx - 1)
      }
      current = newContact()
      depth = 1
      continue
    }
    if (upper.startsWith('END:VCARD')) {
      if (current) {
        finalize(current, contacts, warnings, cardIdx)
        current = null
      }
      depth = 0
      continue
    }
    if (!current) continue // stray line outside a card — ignore
    const parsed = parseLine(line)
    if (!parsed) {
      warnings.push({ card: cardIdx, message: `Skipped unparseable line: ${truncate(line)}` })
      continue
    }
    try {
      applyProperty(current, parsed, warnings, cardIdx)
    } catch (e) {
      warnings.push({
        card: cardIdx,
        message: `Error in property ${parsed.name}: ${(e as Error).message}`,
      })
    }
  }
  if (current) finalize(current, contacts, warnings, cardIdx)
  return { contacts, warnings }
}

function finalize(c: Contact, contacts: Contact[], warnings: ParseWarning[], idx: number) {
  // A card with no identifying data at all is reported but still kept if it has anything.
  const hasAny =
    c.fn || c.n || (c.org && c.org.length) || c.emails.length || c.phones.length ||
    c.addresses.length || c.urls.length || c.note || c.extra.length
  if (!hasAny) {
    warnings.push({ card: idx, message: 'Empty card with no usable fields was dropped.' })
    return
  }
  if (!c.n) c.n = emptyName()
  contacts.push(c)
}

function truncate(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}
