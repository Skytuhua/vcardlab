// Drag-and-drop + file-picker zone for .vcf files. Reads files locally; nothing is uploaded.
import { useCallback, useRef, useState } from 'react'
import { UploadIcon, SpinnerIcon } from './icons'

interface DropzoneProps {
  onFiles: (files: { name: string; text: string }[]) => void
  compact?: boolean
}

async function readFiles(fileList: FileList | File[]): Promise<{ name: string; text: string }[]> {
  const files = Array.from(fileList).filter((f) =>
    /\.(vcf|vcard)$/i.test(f.name) || f.type === 'text/vcard' || f.type === 'text/x-vcard',
  )
  // If the user dropped files without a .vcf extension, still try them (some exports lack it).
  const candidates = files.length ? files : Array.from(fileList)
  return Promise.all(candidates.map(async (f) => ({ name: f.name, text: await f.text() })))
}

export function Dropzone({ onFiles, compact = false }: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = useCallback(
    async (list: FileList | File[]) => {
      setBusy(true)
      try {
        const files = await readFiles(list)
        if (files.length) onFiles(files)
      } finally {
        setBusy(false)
      }
    },
    [onFiles],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (e.dataTransfer.files?.length) void handle(e.dataTransfer.files)
    },
    [handle],
  )

  if (compact) {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`inline-flex h-10 items-center gap-2 rounded-lg border border-dashed px-4 text-sm font-medium cursor-pointer transition-colors duration-150 ${
            dragging ? 'border-accent bg-accent-soft text-accent' : 'border-border text-muted hover:border-accent hover:text-accent'
          }`}
        >
          {busy ? <SpinnerIcon width={16} height={16} /> : <UploadIcon width={16} height={16} />}
          Add files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".vcf,.vcard,text/vcard,text/x-vcard"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && void handle(e.target.files)}
        />
      </>
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      aria-label="Drop vCard files here or click to browse"
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        dragging ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:border-accent/60 hover:bg-muted-surface'
      }`}
    >
      <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${dragging ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent'}`}>
        {busy ? <SpinnerIcon width={26} height={26} /> : <UploadIcon width={26} height={26} />}
      </div>
      <p className="text-base font-semibold text-fg">
        {dragging ? 'Drop to load your contacts' : 'Drop .vcf files here, or click to browse'}
      </p>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Load one or many vCard files from your phone, Google, iCloud or Outlook. New to this? See
        “How to export your contacts” just below. They’re read locally in your browser — nothing is
        uploaded.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".vcf,.vcard,text/vcard,text/x-vcard"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && void handle(e.target.files)}
      />
    </div>
  )
}
