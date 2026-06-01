// Build a ZIP archive in-memory from named text entries, using fflate. No DOM, no network.

import { zipSync, strToU8 } from 'fflate'

export interface ZipEntry {
  name: string
  content: string
}

/** Create a ZIP archive (as bytes) from a list of named text files. */
export function buildZip(entries: ZipEntry[]): Uint8Array {
  const files: Record<string, Uint8Array> = {}
  for (const e of entries) {
    files[e.name] = strToU8(e.content)
  }
  // level 6 is a good size/speed balance for text.
  return zipSync(files, { level: 6 })
}
