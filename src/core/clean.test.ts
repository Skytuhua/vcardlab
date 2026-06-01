import { describe, it, expect } from 'vitest'
import { parseVcf } from './parse'
import {
  stripPhotos,
  dropEmpty,
  trimWhitespace,
  normalizePhoneFormatting,
  repairMojibake,
} from './clean'

function build(card: string) {
  return parseVcf(`BEGIN:VCARD\nVERSION:3.0\n${card}\nEND:VCARD`).contacts
}

describe('stripPhotos', () => {
  it('removes embedded photos', () => {
    const cs = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:P\nPHOTO;ENCODING=b;TYPE=JPEG:QUJD\nEND:VCARD').contacts
    expect(cs[0].photo).toBeTruthy()
    expect(stripPhotos(cs)[0].photo).toBeNull()
  })
  it('leaves photo-less contacts untouched (same reference)', () => {
    const cs = build('FN:NoPic')
    expect(stripPhotos(cs)[0]).toBe(cs[0])
  })
})

describe('dropEmpty', () => {
  it('removes contacts with no identifying fields', () => {
    const cs = build('NOTE:just a note')
    expect(dropEmpty(cs)).toHaveLength(0)
  })
  it('keeps contacts with a name or email', () => {
    const cs = build('FN:Real Person')
    expect(dropEmpty(cs)).toHaveLength(1)
  })
})

describe('trimWhitespace', () => {
  it('trims text fields and values', () => {
    const cs = build('FN:  Spaced  \nEMAIL:  a@x.com  ')
    const out = trimWhitespace(cs)
    expect(out[0].fn).toBe('Spaced')
    expect(out[0].emails[0].value).toBe('a@x.com')
  })
})

describe('normalizePhoneFormatting', () => {
  it('collapses separators and keeps a leading +', () => {
    const cs = build('FN:X\nTEL:+1 (555) 010-0100')
    expect(normalizePhoneFormatting(cs)[0].phones[0].value).toBe('+15550100100')
  })
  it('handles numbers without a plus', () => {
    const cs = build('FN:X\nTEL:(555) 010-0100')
    expect(normalizePhoneFormatting(cs)[0].phones[0].value).toBe('5550100100')
  })
})

describe('repairMojibake', () => {
  it('repairs Latin-1-misread UTF-8 in names', () => {
    // "CafÃ© RenÃ©e" is the mojibake form of "Café Renée".
    const cs = build('FN:CafÃ© RenÃ©e')
    const out = repairMojibake(cs)
    expect(out[0].fn).toBe('Café Renée')
  })
  it('leaves clean text unchanged', () => {
    const cs = build('FN:Clean Name')
    expect(repairMojibake(cs)[0].fn).toBe('Clean Name')
  })
})
