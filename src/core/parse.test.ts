import { describe, it, expect } from 'vitest'
import { parseVcf } from './parse'
import { displayName } from './model'

describe('parseVcf — basic 3.0', () => {
  const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Jane Q. Public
N:Public;Jane;Q.;Dr.;Jr.
ORG:Acme Inc.;Research
TITLE:Engineer
EMAIL;TYPE=WORK:jane@acme.example
EMAIL;TYPE=HOME:jane@home.example
TEL;TYPE=CELL:+1 555 0100
ADR;TYPE=HOME:;;123 Main St;Springfield;IL;62704;USA
URL:https://jane.example
BDAY:1985-04-12
NOTE:Knows everything.
CATEGORIES:Friends,Work
END:VCARD`

  it('parses one contact with all core fields', () => {
    const { contacts, warnings } = parseVcf(vcf)
    expect(warnings).toHaveLength(0)
    expect(contacts).toHaveLength(1)
    const c = contacts[0]
    expect(c.sourceVersion).toBe('3.0')
    expect(c.fn).toBe('Jane Q. Public')
    expect(c.n).toEqual({ family: 'Public', given: 'Jane', additional: 'Q.', prefix: 'Dr.', suffix: 'Jr.' })
    expect(c.org).toEqual(['Acme Inc.', 'Research'])
    expect(c.title).toBe('Engineer')
    expect(c.emails).toHaveLength(2)
    expect(c.emails[0]).toEqual({ value: 'jane@acme.example', types: ['WORK'] })
    expect(c.phones[0].value).toBe('+1 555 0100')
    expect(c.addresses[0].street).toBe('123 Main St')
    expect(c.addresses[0].locality).toBe('Springfield')
    expect(c.urls[0].value).toBe('https://jane.example')
    expect(c.birthday).toBe('1985-04-12')
    expect(c.note).toBe('Knows everything.')
    expect(c.categories).toEqual(['Friends', 'Work'])
  })
})

describe('parseVcf — multiple cards and CRLF', () => {
  it('parses many cards', () => {
    const vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:A One\r\nEND:VCARD\r\nBEGIN:VCARD\r\nVERSION:3.0\r\nFN:B Two\r\nEND:VCARD\r\n'
    const { contacts } = parseVcf(vcf)
    expect(contacts.map((c) => c.fn)).toEqual(['A One', 'B Two'])
  })
})

describe('parseVcf — line folding', () => {
  it('unfolds continuation lines', () => {
    const vcf = `BEGIN:VCARD
VERSION:3.0
FN:Long
NOTE:This is a very long note that has been
  folded across two physical lines.
END:VCARD`
    const { contacts } = parseVcf(vcf)
    expect(contacts[0].note).toBe('This is a very long note that has been folded across two physical lines.')
  })
})

describe('parseVcf — vCard 2.1 quoted-printable', () => {
  it('decodes QP UTF-8 names from Android-style 2.1', () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:2.1',
      'N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=C3=89mile;;;;',
      'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:=C3=89mile',
      'TEL;CELL:+15550111',
      'END:VCARD',
    ].join('\r\n')
    const { contacts } = parseVcf(vcf)
    expect(contacts[0].fn).toBe('Émile')
    expect(contacts[0].n?.family).toBe('Émile')
    expect(contacts[0].phones[0].types).toContain('CELL')
  })

  it('joins QP soft line breaks', () => {
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:2.1',
      'NOTE;ENCODING=QUOTED-PRINTABLE:Caf=C3=A9 part one =',
      'and part two',
      'END:VCARD',
    ].join('\r\n')
    const { contacts } = parseVcf(vcf)
    expect(contacts[0].note).toBe('Café part one and part two')
  })
})

describe('parseVcf — robustness', () => {
  it('does not throw on empty input', () => {
    expect(parseVcf('').contacts).toHaveLength(0)
  })

  it('warns on a malformed line but keeps the card', () => {
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nthis-line-has-no-colon\nFN:Survivor\nEND:VCARD'
    const { contacts, warnings } = parseVcf(vcf)
    expect(contacts[0].fn).toBe('Survivor')
    expect(warnings.some((w) => /unparseable/i.test(w.message))).toBe(true)
  })

  it('drops a card with no usable fields', () => {
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD'
    const { contacts, warnings } = parseVcf(vcf)
    expect(contacts).toHaveLength(0)
    expect(warnings.some((w) => /empty card/i.test(w.message))).toBe(true)
  })

  it('preserves unknown properties in extra', () => {
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nFN:X\nX-CUSTOM;PARAM=1:hello\nEND:VCARD'
    const { contacts } = parseVcf(vcf)
    expect(contacts[0].extra[0].name).toBe('X-CUSTOM')
    expect(contacts[0].extra[0].value).toBe('hello')
  })

  it('handles grouped properties (itemN.)', () => {
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nFN:Grouped\nitem1.URL:https://x.example\nitem1.X-ABLabel:homepage\nEND:VCARD'
    const { contacts } = parseVcf(vcf)
    expect(contacts[0].urls[0].value).toBe('https://x.example')
  })
})

describe('displayName fallbacks', () => {
  it('falls back through N → org → email', () => {
    const vcf = 'BEGIN:VCARD\nVERSION:3.0\nEMAIL:only@example.com\nEND:VCARD'
    const { contacts } = parseVcf(vcf)
    expect(displayName(contacts[0])).toBe('only@example.com')
  })
})
