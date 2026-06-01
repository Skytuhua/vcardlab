// Serializers: Contact[] → vCard (2.1/3.0/4.0), CSV, or JSON. All pure, framework-free.

import { type Contact, type TypedValue, displayName } from './model'
import { encodeQuotedPrintable } from './quotedPrintable'

export type OutputVersion = '2.1' | '3.0' | '4.0'

const CRLF = '\r\n'

/** Escape a text value for a vCard property. */
function esc(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function hasNonAscii(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) > 0x7f) return true
  }
  return false
}

function octetLen(ch: string): number {
  const code = ch.codePointAt(0)!
  if (code < 0x80) return 1
  if (code < 0x800) return 2
  if (code < 0x10000) return 3
  return 4
}

/**
 * Fold a single logical line to <=75 octets per physical line using CRLF + single space
 * continuation. Counts UTF-8 octets (not UTF-16 units) and never splits a character.
 */
function fold(line: string): string {
  // Fast path: pure ASCII within the limit.
  if (line.length <= 75 && octetLenStr(line) === line.length) return line
  const chars = Array.from(line) // split on code points, keeping surrogate pairs intact
  const result: string[] = []
  let cur = ''
  let curOctets = 0
  let limit = 75 // first line has no leading space
  for (const ch of chars) {
    const w = octetLen(ch)
    if (curOctets + w > limit) {
      result.push(cur)
      cur = ''
      curOctets = 0
      limit = 74 // continuation lines start with a space that counts toward 75
    }
    cur += ch
    curOctets += w
  }
  if (cur) result.push(cur)
  return result.join(CRLF + ' ')
}

function octetLenStr(s: string): number {
  let n = 0
  for (const ch of s) n += octetLen(ch)
  return n
}

interface PropOpts {
  name: string
  value: string
  types?: string[]
  /** Already-formatted extra parameters, e.g. ["VALUE=URI"]. */
  extraParams?: string[]
  /** Skip text escaping (for pre-formatted values like base64). */
  raw?: boolean
}

function renderProp(version: OutputVersion, o: PropOpts): string {
  const params: string[] = []
  if (o.types && o.types.length) {
    if (version === '2.1') {
      // 2.1 uses bare type tokens.
      params.push(...o.types.map((t) => t.toUpperCase()))
    } else {
      params.push('TYPE=' + o.types.map((t) => t.toUpperCase()).join(','))
    }
  }
  if (o.extraParams) params.push(...o.extraParams)

  let value = o.raw ? o.value : esc(o.value)

  // vCard 2.1 cannot carry raw UTF-8; encode non-ASCII as quoted-printable.
  if (version === '2.1' && !o.raw && hasNonAscii(value)) {
    params.push('CHARSET=UTF-8', 'ENCODING=QUOTED-PRINTABLE')
    value = encodeQuotedPrintable(o.value) // encode the unescaped original
  }

  const header = [o.name, ...params].join(';')
  return fold(`${header}:${value}`)
}

function typedLines(version: OutputVersion, name: string, items: TypedValue[]): string[] {
  return items.map((it) => renderProp(version, { name, value: it.value, types: it.types }))
}

/** Serialize one contact to a vCard string (no trailing newline). */
export function serializeContact(contact: Contact, version: OutputVersion): string {
  const lines: string[] = []
  lines.push('BEGIN:VCARD')
  lines.push('VERSION:' + version)

  const fn = displayName(contact)
  lines.push(renderProp(version, { name: 'FN', value: fn }))

  if (contact.n) {
    const n = contact.n
    const nValue = [n.family, n.given, n.additional, n.prefix, n.suffix].map(esc).join(';')
    // N is structured: render manually so the ';' separators are not escaped.
    let line = 'N:' + nValue
    if (version === '2.1' && hasNonAscii([n.family, n.given, n.additional, n.prefix, n.suffix].join(''))) {
      const rawVal = [n.family, n.given, n.additional, n.prefix, n.suffix]
        .map(encodeQuotedPrintable)
        .join(';')
      line = 'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:' + rawVal
    }
    lines.push(fold(line))
  }

  if (contact.nickname) lines.push(renderProp(version, { name: 'NICKNAME', value: contact.nickname }))

  if (contact.org && contact.org.length) {
    const orgVal = contact.org.map(esc).join(';')
    lines.push(fold('ORG:' + orgVal))
  }
  if (contact.title) lines.push(renderProp(version, { name: 'TITLE', value: contact.title }))

  lines.push(...typedLines(version, 'EMAIL', contact.emails))
  lines.push(...typedLines(version, 'TEL', contact.phones))
  lines.push(...typedLines(version, 'URL', contact.urls))

  for (const a of contact.addresses) {
    const comps = [a.poBox, a.ext, a.street, a.locality, a.region, a.postal, a.country]
    const adrVal = comps.map(esc).join(';')
    const typeParam =
      a.types && a.types.length
        ? version === '2.1'
          ? ';' + a.types.map((t) => t.toUpperCase()).join(';')
          : ';TYPE=' + a.types.map((t) => t.toUpperCase()).join(',')
        : ''
    lines.push(fold(`ADR${typeParam}:${adrVal}`))
  }

  if (contact.birthday) lines.push(fold('BDAY:' + contact.birthday))
  if (contact.note) lines.push(renderProp(version, { name: 'NOTE', value: contact.note }))
  if (contact.categories.length) {
    lines.push(fold('CATEGORIES:' + contact.categories.map(esc).join(',')))
  }

  if (contact.photo) {
    if (contact.photo.isUri) {
      if (version === '4.0') {
        lines.push(fold('PHOTO:' + contact.photo.data))
      } else {
        lines.push(fold('PHOTO;VALUE=URI:' + contact.photo.data))
      }
    } else {
      const mt = contact.photo.mediaType || 'JPEG'
      if (version === '4.0') {
        const mime = mt.includes('/') ? mt : `image/${mt.toLowerCase()}`
        lines.push(fold(`PHOTO:data:${mime};base64,${contact.photo.data}`))
      } else if (version === '3.0') {
        lines.push(fold(`PHOTO;ENCODING=b;TYPE=${mt.toUpperCase()}:${contact.photo.data}`))
      } else {
        lines.push(fold(`PHOTO;ENCODING=BASE64;TYPE=${mt.toUpperCase()}:${contact.photo.data}`))
      }
    }
  }

  for (const raw of contact.extra) {
    const head = (raw.group ? raw.group + '.' : '') + raw.name
    // Sanitize parameter values (strip structural chars) and escape CR/LF in the value so
    // an unmodeled property can't inject extra vCard lines on re-serialization.
    const params = raw.params.map(([k, v]) => `${k}=${v.replace(/[;:\r\n]/g, ' ')}`)
    const safeValue = raw.value.replace(/\r\n|\r|\n/g, '\\n')
    lines.push(fold([head, ...params].join(';') + ':' + safeValue))
  }

  lines.push('END:VCARD')
  return lines.join(CRLF)
}

/** Serialize many contacts to a single vCard document. */
export function serializeVcards(contacts: Contact[], version: OutputVersion): string {
  return contacts.map((c) => serializeContact(c, version)).join(CRLF) + CRLF
}

// ---------- CSV ----------

function csvCell(value: string): string {
  let v = value
  // Neutralize spreadsheet formula injection: a cell starting with = + - @ (or a
  // tab/CR lead-in) is treated as a formula by Excel/Sheets. Prefix with an apostrophe
  // so it is shown literally. Quoting alone does NOT prevent this.
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v
  if (/[",\n\r]/.test(v)) return '"' + v.replace(/"/g, '""') + '"'
  return v
}

/** Convert contacts to a spreadsheet/CRM-friendly CSV string. */
export function toCsv(contacts: Contact[]): string {
  const maxEmails = Math.max(1, ...contacts.map((c) => c.emails.length))
  const maxPhones = Math.max(1, ...contacts.map((c) => c.phones.length))
  const maxAddr = Math.max(0, ...contacts.map((c) => c.addresses.length))

  const headers = [
    'Name',
    'Given Name',
    'Family Name',
    'Nickname',
    'Organization',
    'Title',
  ]
  for (let i = 1; i <= maxEmails; i++) headers.push(`E-mail ${i} - Type`, `E-mail ${i} - Value`)
  for (let i = 1; i <= maxPhones; i++) headers.push(`Phone ${i} - Type`, `Phone ${i} - Value`)
  for (let i = 1; i <= maxAddr; i++) headers.push(`Address ${i} - Type`, `Address ${i} - Formatted`)
  headers.push('Birthday', 'URLs', 'Categories', 'Notes')

  const rows: string[] = [headers.map(csvCell).join(',')]
  for (const c of contacts) {
    const cells: string[] = [
      displayName(c),
      c.n?.given ?? '',
      c.n?.family ?? '',
      c.nickname ?? '',
      (c.org ?? []).join(' '),
      c.title ?? '',
    ]
    for (let i = 0; i < maxEmails; i++) {
      cells.push((c.emails[i]?.types ?? []).join('/'), c.emails[i]?.value ?? '')
    }
    for (let i = 0; i < maxPhones; i++) {
      cells.push((c.phones[i]?.types ?? []).join('/'), c.phones[i]?.value ?? '')
    }
    for (let i = 0; i < maxAddr; i++) {
      const a = c.addresses[i]
      const formatted = a
        ? [a.street, a.locality, a.region, a.postal, a.country].filter(Boolean).join(', ')
        : ''
      cells.push((a?.types ?? []).join('/'), formatted)
    }
    cells.push(
      c.birthday ?? '',
      c.urls.map((u) => u.value).join(' '),
      c.categories.join('/'),
      c.note ?? '',
    )
    rows.push(cells.map(csvCell).join(','))
  }
  // Prepend a UTF-8 BOM so Excel reads non-ASCII correctly.
  return '﻿' + rows.join('\r\n') + '\r\n'
}

// ---------- JSON ----------

/** Convert contacts to a clean JSON string (drops internal-only fields). */
export function toJson(contacts: Contact[]): string {
  const projected = contacts.map((c) => ({
    name: displayName(c),
    formattedName: c.fn,
    structuredName: c.n,
    nickname: c.nickname,
    organization: c.org,
    title: c.title,
    emails: c.emails,
    phones: c.phones,
    addresses: c.addresses,
    urls: c.urls,
    birthday: c.birthday,
    note: c.note,
    categories: c.categories,
    hasPhoto: !!c.photo,
    sourceVersion: c.sourceVersion,
  }))
  return JSON.stringify(projected, null, 2)
}
