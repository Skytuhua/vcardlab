import { describe, it, expect } from 'vitest'
import { parseVcf } from './parse'
import {
  findDuplicates,
  mergeContacts,
  mergeAllDuplicates,
  normalizePhone,
  defaultMatchOptions,
} from './dedupe'

function build(...cards: string[]): ReturnType<typeof parseVcf>['contacts'] {
  return parseVcf(cards.map((c) => `BEGIN:VCARD\nVERSION:3.0\n${c}\nEND:VCARD`).join('\n')).contacts
}

describe('normalizePhone', () => {
  it('strips separators and keeps the last 10 digits', () => {
    expect(normalizePhone('+1 (555) 010-0200')).toBe('5550100200')
    expect(normalizePhone('555.0100')).toBe('5550100')
    expect(normalizePhone('')).toBe('')
  })
})

describe('findDuplicates', () => {
  it('groups by shared email', () => {
    const cs = build('FN:Jane A\nEMAIL:jane@x.com', 'FN:Jane B\nEMAIL:JANE@x.com')
    const groups = findDuplicates(cs, defaultMatchOptions)
    expect(groups).toHaveLength(1)
    expect(groups[0].ids).toHaveLength(2)
  })

  it('groups by phone across country-code variants', () => {
    // A full 10-digit number with vs without the +1 country code should match.
    const cs = build('FN:Bob\nTEL:+1 (555) 010-0100', 'FN:Bobby\nTEL:555 010 0100')
    const groups = findDuplicates(cs, { byPhone: true, byEmail: false, byName: false })
    expect(groups).toHaveLength(1)
  })

  it('does NOT group unrelated contacts', () => {
    const cs = build('FN:A\nEMAIL:a@x.com', 'FN:B\nEMAIL:b@x.com')
    expect(findDuplicates(cs, defaultMatchOptions)).toHaveLength(0)
  })

  it('transitively groups via a chain of shared keys', () => {
    const cs = build(
      'FN:One\nEMAIL:shared1@x.com',
      'FN:Two\nEMAIL:shared1@x.com\nTEL:5550999',
      'FN:Three\nTEL:5550999',
    )
    const groups = findDuplicates(cs, defaultMatchOptions)
    expect(groups).toHaveLength(1)
    expect(groups[0].ids).toHaveLength(3)
  })

  it('respects byName option', () => {
    const cs = build('FN:John Smith\nEMAIL:a@x.com', 'FN:John Smith\nEMAIL:b@x.com')
    expect(findDuplicates(cs, { byPhone: false, byEmail: false, byName: false })).toHaveLength(0)
    expect(findDuplicates(cs, { byPhone: false, byEmail: false, byName: true })).toHaveLength(1)
  })
})

describe('mergeContacts', () => {
  it('unions emails, phones and types', () => {
    const cs = build(
      'FN:Jane\nEMAIL;TYPE=WORK:jane@x.com\nTEL;TYPE=CELL:5550100',
      'FN:Jane\nEMAIL;TYPE=HOME:jane@x.com\nEMAIL:jane@home.com\nTEL:5550100',
    )
    const merged = mergeContacts(cs)
    expect(merged.emails).toHaveLength(2)
    const primary = merged.emails.find((e) => e.value === 'jane@x.com')!
    expect(primary.types.sort()).toEqual(['HOME', 'WORK'])
    expect(merged.phones).toHaveLength(1)
  })

  it('keeps the most complete structured name', () => {
    const cs = build('FN:J\nN:;Jane;;;', 'FN:J\nN:Doe;Jane;Q.;;')
    const merged = mergeContacts(cs)
    expect(merged.n?.family).toBe('Doe')
    expect(merged.n?.additional).toBe('Q.')
  })

  it('throws on an empty group', () => {
    expect(() => mergeContacts([])).toThrow()
  })
})

describe('mergeAllDuplicates', () => {
  it('collapses groups and preserves singletons', () => {
    const cs = build(
      'FN:Dup A\nEMAIL:d@x.com',
      'FN:Dup B\nEMAIL:d@x.com',
      'FN:Unique\nEMAIL:u@x.com',
    )
    const out = mergeAllDuplicates(cs, defaultMatchOptions)
    expect(out).toHaveLength(2)
    expect(out.map((c) => c.fn)).toContain('Unique')
  })

  it('returns the same list when there are no duplicates', () => {
    const cs = build('FN:A\nEMAIL:a@x.com', 'FN:B\nEMAIL:b@x.com')
    expect(mergeAllDuplicates(cs, defaultMatchOptions)).toHaveLength(2)
  })
})
