// Browser download helpers. The only place that touches Blob/DOM for output.
// Everything stays local — these create object URLs from in-memory data and never upload.

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadText(content: string, filename: string, mime = 'text/plain') {
  triggerDownload(new Blob([content], { type: `${mime};charset=utf-8` }), filename)
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime = 'application/octet-stream') {
  // Copy into a fresh ArrayBuffer-backed view so the Blob type is unambiguous.
  const buf = new Uint8Array(bytes)
  triggerDownload(new Blob([buf], { type: mime }), filename)
}
