// Quoted-Printable decoding, charset-aware. Common in vCard 2.1 exports from Android phones.

/** Map a few charset aliases to labels the platform TextDecoder understands. */
function normalizeCharset(charset?: string): string {
  if (!charset) return 'utf-8'
  const c = charset.trim().toLowerCase()
  const map: Record<string, string> = {
    'utf8': 'utf-8',
    'utf-8': 'utf-8',
    'latin1': 'iso-8859-1',
    'latin-1': 'iso-8859-1',
    'iso8859-1': 'iso-8859-1',
    'iso-8859-1': 'iso-8859-1',
    'cp1252': 'windows-1252',
    'windows-1252': 'windows-1252',
    'us-ascii': 'utf-8',
    'ascii': 'utf-8',
  }
  return map[c] ?? c
}

/**
 * Decode a quoted-printable string into text.
 * Soft line breaks (`=` at end of a physical line) are assumed already joined by the
 * line-assembler; any remaining `=\r?\n` are also treated as soft breaks here for safety.
 */
export function decodeQuotedPrintable(input: string, charset?: string): string {
  // Remove soft line breaks that may survive.
  const cleaned = input.replace(/=\r?\n/g, '')
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]
    if (ch === '=' && i + 2 < cleaned.length) {
      const hex = cleaned.slice(i + 1, i + 3)
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16))
        i += 2
        continue
      }
    }
    // Non-encoded character: push its byte(s). For ASCII this is the code point;
    // for any stray multi-byte char, encode as UTF-8 to preserve it.
    const code = ch.charCodeAt(0)
    if (code < 0x80) {
      bytes.push(code)
    } else {
      for (const b of new TextEncoder().encode(ch)) bytes.push(b)
    }
  }
  const label = normalizeCharset(charset)
  try {
    return new TextDecoder(label, { fatal: false }).decode(new Uint8Array(bytes))
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes))
  }
}

/** Encode a string as quoted-printable (UTF-8 bytes), used when writing 2.1 output. */
export function encodeQuotedPrintable(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let out = ''
  for (const b of bytes) {
    // Printable ASCII except '=' is passed through; everything else is encoded.
    if (b >= 0x20 && b <= 0x7e && b !== 0x3d) {
      out += String.fromCharCode(b)
    } else {
      out += '=' + b.toString(16).toUpperCase().padStart(2, '0')
    }
  }
  return out
}
