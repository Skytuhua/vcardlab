import { describe, it, expect } from 'vitest'
import { chunk, contactSlug, uniqueNames } from './split'
import { buildZip } from './zip'
import { unzipSync, strFromU8 } from 'fflate'
import { parseVcf } from './parse'

describe('chunk', () => {
  it('splits into N-sized groups', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  })
  it('throws on non-positive size', () => {
    expect(() => chunk([1], 0)).toThrow()
  })
})

describe('contactSlug', () => {
  it('produces a safe, numbered slug', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nFN:Jane Q. Public!\nEND:VCARD').contacts[0]
    expect(contactSlug(c, 0)).toBe('0001_Jane_Q_Public')
  })
  it('falls back when there is no name', () => {
    const c = parseVcf('BEGIN:VCARD\nVERSION:3.0\nTEL:5550100\nEND:VCARD').contacts[0]
    expect(contactSlug(c, 4)).toMatch(/^0005_/)
  })
})

describe('uniqueNames', () => {
  it('disambiguates collisions', () => {
    expect(uniqueNames(['a', 'a', 'b', 'a'])).toEqual(['a', 'a_2', 'b', 'a_3'])
  })
})

describe('buildZip', () => {
  it('creates a readable zip archive of text entries', () => {
    const bytes = buildZip([
      { name: '0001_a.vcf', content: 'BEGIN:VCARD' },
      { name: '0002_b.vcf', content: 'END:VCARD' },
    ])
    const back = unzipSync(bytes)
    expect(Object.keys(back).sort()).toEqual(['0001_a.vcf', '0002_b.vcf'])
    expect(strFromU8(back['0001_a.vcf'])).toBe('BEGIN:VCARD')
  })
})
