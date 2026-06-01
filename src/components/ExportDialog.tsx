// Export / convert / split dialog. Builds the chosen output in-memory and downloads it.
import { useMemo, useState } from 'react'
import {
  type Contact,
  type OutputVersion,
  serializeVcards,
  serializeContact,
  toCsv,
  toJson,
  chunk,
  contactSlug,
  uniqueNames,
  buildZip,
} from '../core'
import { Modal } from './Modal'
import { Button } from './ui'
import { DownloadIcon } from './icons'
import { downloadText, downloadBytes } from '../lib/download'

type Format = 'vcard' | 'csv' | 'json'
type SplitMode = 'single' | 'perN' | 'perCard'

interface Props {
  allContacts: Contact[]
  selectedContacts: Contact[]
  onClose: () => void
  onDone: (message: string) => void
}

export function ExportDialog({ allContacts, selectedContacts, onClose, onDone }: Props) {
  const hasSelection = selectedContacts.length > 0
  const [scope, setScope] = useState<'all' | 'selected'>(hasSelection ? 'selected' : 'all')
  const [format, setFormat] = useState<Format>('vcard')
  const [version, setVersion] = useState<OutputVersion>('3.0')
  const [splitMode, setSplitMode] = useState<SplitMode>('single')
  const [perN, setPerN] = useState(100)

  const contacts = scope === 'selected' ? selectedContacts : allContacts
  const stamp = useMemo(() => new Date().toISOString().slice(0, 10), [])

  function run() {
    if (contacts.length === 0) return
    if (format === 'csv') {
      downloadText(toCsv(contacts), `contacts-${stamp}.csv`, 'text/csv')
      onDone(`Exported ${contacts.length} contacts to CSV.`)
      return
    }
    if (format === 'json') {
      downloadText(toJson(contacts), `contacts-${stamp}.json`, 'application/json')
      onDone(`Exported ${contacts.length} contacts to JSON.`)
      return
    }
    // vCard
    if (splitMode === 'single') {
      downloadText(serializeVcards(contacts, version), `contacts-${stamp}.vcf`, 'text/vcard')
      onDone(`Exported ${contacts.length} contacts to one vCard ${version} file.`)
      return
    }
    if (splitMode === 'perN') {
      const groups = chunk(contacts, Math.max(1, perN))
      const entries = groups.map((g, i) => ({
        name: `contacts-${String(i + 1).padStart(3, '0')}.vcf`,
        content: serializeVcards(g, version),
      }))
      downloadBytes(buildZip(entries), `contacts-split-${stamp}.zip`, 'application/zip')
      onDone(`Split ${contacts.length} contacts into ${groups.length} files (ZIP).`)
      return
    }
    // perCard
    const names = uniqueNames(contacts.map((c, i) => contactSlug(c, i) + '.vcf'))
    const entries = contacts.map((c, i) => ({ name: names[i], content: serializeContact(c, version) + '\r\n' }))
    downloadBytes(buildZip(entries), `contacts-cards-${stamp}.zip`, 'application/zip')
    onDone(`Exported ${contacts.length} contacts as individual vCard files (ZIP).`)
  }

  return (
    <Modal
      title="Export contacts"
      onClose={onClose}
      width="max-w-md"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted tnum">
            {contacts.length} contact{contacts.length === 1 ? '' : 's'}
          </span>
          <Button variant="primary" onClick={run} disabled={contacts.length === 0}>
            <DownloadIcon width={18} height={18} /> Export
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {hasSelection && (
          <Group label="Which contacts">
            <Segmented
              value={scope}
              onChange={(v) => setScope(v as 'all' | 'selected')}
              options={[
                { value: 'selected', label: `Selected (${selectedContacts.length})` },
                { value: 'all', label: `All (${allContacts.length})` },
              ]}
            />
          </Group>
        )}

        <Group label="Format">
          <Segmented
            value={format}
            onChange={(v) => setFormat(v as Format)}
            options={[
              { value: 'vcard', label: 'vCard' },
              { value: 'csv', label: 'CSV' },
              { value: 'json', label: 'JSON' },
            ]}
          />
          <p className="mt-1.5 text-xs text-muted">
            {format === 'vcard' && 'Standard contact file for phones, Google, iCloud and Outlook.'}
            {format === 'csv' && 'Spreadsheet / CRM-friendly columns. Opens in Excel or Sheets.'}
            {format === 'json' && 'Structured data for developers and scripts.'}
          </p>
        </Group>

        {format === 'vcard' && (
          <>
            <Group label="vCard version">
              <Segmented
                value={version}
                onChange={(v) => setVersion(v as OutputVersion)}
                options={[
                  { value: '2.1', label: '2.1' },
                  { value: '3.0', label: '3.0' },
                  { value: '4.0', label: '4.0' },
                ]}
              />
              <p className="mt-1.5 text-xs text-muted">
                {version === '2.1' && 'Maximum compatibility with older phones (non-ASCII is encoded).'}
                {version === '3.0' && 'The most widely supported version. Recommended.'}
                {version === '4.0' && 'Modern standard (RFC 6350) with UTF-8 and data-URI photos.'}
              </p>
            </Group>

            <Group label="Split">
              <div className="flex flex-col gap-2">
                <Radio name="split" checked={splitMode === 'single'} onChange={() => setSplitMode('single')} label="One combined file" />
                <Radio name="split" checked={splitMode === 'perCard'} onChange={() => setSplitMode('perCard')} label="One file per contact (ZIP)" />
                <div className="flex items-center gap-2">
                  <Radio name="split" checked={splitMode === 'perN'} onChange={() => setSplitMode('perN')} label="Batches of" />
                  <input
                    type="number"
                    min={1}
                    value={perN}
                    onChange={(e) => setPerN(Math.max(1, Number(e.target.value) || 1))}
                    onFocus={() => setSplitMode('perN')}
                    className="h-8 w-20 rounded-md border border-border bg-surface px-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tnum"
                    aria-label="Contacts per file"
                  />
                  <span className="text-sm text-muted">per file (ZIP)</span>
                </div>
              </div>
            </Group>
          </>
        )}
      </div>
    </Modal>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</h3>
      {children}
    </div>
  )
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-border bg-muted-surface p-1" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
            value === o.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Radio({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-fg">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
      {label}
    </label>
  )
}
