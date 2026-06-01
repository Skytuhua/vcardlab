import { describe, it, expect } from 'vitest'
import { parseVcf } from './parse'
import { serializeVcards, serializeContact, toCsv, toJson } from './serialize'
import { type Contact, emptyName } from './model'

const sample = `BEGIN:VCARD
VERSION:3.0
FN:Jane Public
N:Public;Jane;;;
ORG:Acme;Research
EMAIL;TYPE=WORK:jane@acme.example
TEL;TYPE=CELL:+15550100
ADR;TYPE=HOME:;;1 Main St;Springfield;IL;62704;USA
NOTE:Has a comma\\, a semicolon\\; and a newline\\nsecond line
CATEGORIES:Friends,Work
END:VCARD`

describe('vCard round-trip', () => {
  it('parse → serialize 3.0 → parse preserves core data', () => {
    const a = parseVcf(sample).contacts[0]
    const out = serializeContact(a, '3.0')
    expect(out).toContain('BEGIN:VCARD')
    expect(out).toContain('VERSION:3.0')
    const b = parseVcf(out).contacts[0]
    expect(b.fn).toBe('Jane Public')
    expect(b.org).toEqual(['Acme', 'Research'])
    expect(b.emails[0].value).toBe('jane@acme.example')
    expect(b.phones[0].value).toBe('+15550100')
    expect(b.addresses[0].street).toBe('1 Main St')
    // The comma, semicolon and newline survive the escape round-trip.
    expect(b.note).toBe('Has a comma, a semicolon; and a newline\nsecond line')
    expect(b.categories).toEqual(['Friends', 'Work'])
  })

  it('escapes commas, semicolons and newlines in text values', () => {
    const a = parseVcf(sample).contacts[0]
    const out = serializeContact(a, '3.0')
    // NOTE value should escape the literal comma/semicolon/newline.
    const noteLine = out.split('\r\n').find((l) => l.startsWith('NOTE'))!
    expect(noteLine).toContain('\\,')
    expect(noteLine).toContain('\\;')
    expect(noteLine).toContain('\\n')
  })

  it('emits quoted-printable for non-ASCII when writing 2.1', () => {
    const a = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:Café Owner\nEND:VCARD').contacts[0]
    const out = serializeContact(a, '2.1')
    expect(out).toContain('ENCODING=QUOTED-PRINTABLE')
    expect(out).toContain('=C3=A9') // é
    // And it should round-trip back.
    const b = parseVcf(out).contacts[0]
    expect(b.fn).toBe('Café Owner')
  })

  it('writes 4.0 photo as a data URI', () => {
    const withPhoto = 'BEGIN:VCARD\nVERSION:3.0\nFN:Pic\nPHOTO;ENCODING=b;TYPE=JPEG:QUJD\nEND:VCARD'
    const a = parseVcf(withPhoto).contacts[0]
    const out = serializeContact(a, '4.0')
    expect(out).toContain('PHOTO:data:image/jpeg;base64,QUJD')
  })

  it('folds long lines to <= 75 octets per physical line', () => {
    const a = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:X\nNOTE:' + 'A'.repeat(300) + '\nEND:VCARD').contacts[0]
    const out = serializeContact(a, '3.0')
    for (const line of out.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75)
    }
  })

  it('does not let an unmodeled property inject extra vCard lines', () => {
    // An X- property whose decoded value contains a newline must not break the structure.
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:X\nX-NOTE;ENCODING=QUOTED-PRINTABLE:a=0D=0Ainjected\nEND:VCARD').contacts[0]
    const out = serializeContact(c, '3.0')
    // Exactly one BEGIN and one END — no smuggled lines.
    expect(out.match(/BEGIN:VCARD/g)).toHaveLength(1)
    expect(out.match(/END:VCARD/g)).toHaveLength(1)
    // Re-parsing yields a single clean card.
    expect(parseVcf(out).contacts).toHaveLength(1)
  })

  it('folds multi-byte UTF-8 without splitting a character', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:X\nNOTE:' + 'é'.repeat(120) + '\nEND:VCARD').contacts[0]
    const out = serializeContact(c, '4.0')
    for (const line of out.split('\r\n')) {
      // Each physical line is <= 75 octets and contains only whole characters.
      const octets = new TextEncoder().encode(line).length
      expect(octets).toBeLessThanOrEqual(75)
    }
    // And it round-trips intact.
    expect(parseVcf(out).contacts[0].note).toBe('é'.repeat(120))
  })

  it('serializeVcards joins multiple cards with a trailing newline', () => {
    const cs = parseVcf(sample + '\n' + sample).contacts
    const out = serializeVcards(cs, '3.0')
    expect(out.match(/BEGIN:VCARD/g)).toHaveLength(2)
    expect(out.endsWith('\r\n')).toBe(true)
  })
})

describe('CSV export', () => {
  it('produces a header row and a data row with a BOM', () => {
    const cs = parseVcf(sample).contacts
    const csv = toCsv(cs)
    expect(csv.charCodeAt(0)).toBe(0xfeff) // BOM
    const lines = csv.slice(1).trim().split('\r\n')
    expect(lines[0]).toContain('Name')
    expect(lines[0]).toContain('E-mail 1 - Value')
    expect(lines[1]).toContain('Jane Public')
    expect(lines[1]).toContain('jane@acme.example')
  })

  it('quotes cells containing commas or quotes', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:Doe, John\nEND:VCARD').contacts[0]
    const csv = toCsv([c])
    expect(csv).toContain('"Doe, John"')
  })

  it('neutralizes spreadsheet formula injection', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:=HYPERLINK("http://evil")\nORG:+1+1\nEND:VCARD').contacts[0]
    const csv = toCsv([c])
    // Formula-leading cells get an apostrophe guard so Excel/Sheets show them literally.
    expect(csv).toContain(`"'=HYPERLINK`)
    expect(csv).toContain(`'+1+1`)
    expect(csv).not.toMatch(/(^|,)=HYPERLINK/)
  })
})

describe('JSON export', () => {
  it('emits clean projected JSON', () => {
    const cs = parseVcf(sample).contacts
    const json = JSON.parse(toJson(cs))
    expect(json[0].name).toBe('Jane Public')
    expect(json[0].emails[0].value).toBe('jane@acme.example')
    expect(json[0]).not.toHaveProperty('id')
  })
})

describe('exported output stays clean', () => {
  it('never leaks the "(no name)" UI placeholder into vCard / CSV / JSON', () => {
    // A note-only card has no usable name; the UI shows "(no name)" but files must not.
    const noteOnly = parseVcf('BEGIN:VCARD\nVERSION:3.0\nNOTE:just a note\nEND:VCARD').contacts[0]
    const vcf = serializeContact(noteOnly, '3.0')
    expect(vcf).not.toContain('(no name)')
    expect(vcf).toContain('FN:') // FN is still present, just empty
    expect(toCsv([noteOnly])).not.toContain('(no name)')
    expect(JSON.parse(toJson([noteOnly]))[0].name).toBe('')
  })

  it('drops blank email/phone/URL rows so there are no empty property lines', () => {
    const c: Contact = {
      id: 'c1',
      fn: 'Test Person',
      n: emptyName(),
      emails: [
        { value: 'real@example.com', types: ['home'] },
        { value: '', types: ['work'] }, // unfilled "Add email" row
      ],
      phones: [{ value: '   ', types: ['cell'] }], // whitespace-only
      addresses: [],
      urls: [{ value: '', types: [] }],
      categories: [],
      extra: [],
      sourceVersion: '3.0',
    }
    const vcf = serializeContact(c, '3.0')
    expect(vcf).toContain('EMAIL;TYPE=HOME:real@example.com')
    // No empty value lines.
    expect(vcf).not.toMatch(/EMAIL[^:\r\n]*:\r?\n/)
    expect(vcf).not.toMatch(/TEL[^:]*:(\r|\n|$)/)
    expect(vcf).not.toMatch(/^URL[^:]*:$/m)
  })
})
