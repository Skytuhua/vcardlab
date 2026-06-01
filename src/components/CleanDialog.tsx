// Clean / fix operations. Each option previews how many contacts it would affect; "Apply"
// runs the selected operations in order as a single undoable transform.
import { useMemo, useState } from 'react'
import {
  type Contact,
  stripPhotos,
  dropEmpty,
  trimWhitespace,
  normalizePhoneFormatting,
  repairMojibake,
} from '../core'
import { Modal } from './Modal'
import { Button } from './ui'
import { CleanIcon } from './icons'

interface Op {
  key: string
  label: string
  description: string
  fn: (cs: Contact[]) => Contact[]
  /** count how many contacts this op would change (for the preview) */
  affected: (cs: Contact[]) => number
}

const OPS: Op[] = [
  {
    key: 'photos',
    label: 'Strip embedded photos',
    description: 'Remove photos to shrink the file and drop hidden image metadata.',
    fn: stripPhotos,
    affected: (cs) => cs.filter((c) => c.photo).length,
  },
  {
    key: 'mojibake',
    label: 'Repair garbled text',
    description: 'Fix names like “CafÃ©” that should read “Café” (broken UTF-8 decoding).',
    fn: repairMojibake,
    affected: (cs) => cs.filter((c) => /Ã.|Â.|â€/.test([c.fn, c.note, ...(c.org ?? [])].join(' '))).length,
  },
  {
    key: 'trim',
    label: 'Trim extra whitespace',
    description: 'Remove leading/trailing spaces from names, emails and phone numbers.',
    fn: trimWhitespace,
    affected: (cs) => cs.length,
  },
  {
    key: 'phones',
    label: 'Normalize phone formatting',
    description: 'Unify phone numbers to digits with an optional leading “+”.',
    fn: normalizePhoneFormatting,
    affected: (cs) => cs.filter((c) => c.phones.some((p) => /[^\d+]/.test(p.value))).length,
  },
  {
    key: 'empty',
    label: 'Remove empty contacts',
    description: 'Drop cards with no name, email, phone or address.',
    fn: dropEmpty,
    affected: (cs) => cs.length - dropEmpty(cs).length,
  },
]

interface Props {
  contacts: Contact[]
  onApply: (fn: (cs: Contact[]) => Contact[], summary: string) => void
  onClose: () => void
}

export function CleanDialog({ contacts, onApply, onClose }: Props) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ photos: false, mojibake: true, trim: true, phones: false, empty: false })
  const counts = useMemo(() => Object.fromEntries(OPS.map((o) => [o.key, o.affected(contacts)])), [contacts])

  const selectedOps = OPS.filter((o) => enabled[o.key])

  function apply() {
    if (selectedOps.length === 0) return
    const composed = (cs: Contact[]) => selectedOps.reduce((acc, op) => op.fn(acc), cs)
    onApply(composed, `Applied ${selectedOps.length} cleanup operation${selectedOps.length === 1 ? '' : 's'}.`)
  }

  return (
    <Modal
      title="Clean & fix"
      onClose={onClose}
      width="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={apply} disabled={selectedOps.length === 0}>
            <CleanIcon width={16} height={16} /> Apply {selectedOps.length || ''}
          </Button>
        </div>
      }
    >
      <ul className="flex flex-col gap-2">
        {OPS.map((op) => (
          <li key={op.key}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-muted-surface">
              <input
                type="checkbox"
                checked={!!enabled[op.key]}
                onChange={() => setEnabled((e) => ({ ...e, [op.key]: !e[op.key] }))}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent)]"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg">{op.label}</span>
                  <span className="shrink-0 text-xs text-muted tnum">
                    {counts[op.key] > 0 ? `${counts[op.key]} affected` : 'none'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">{op.description}</p>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  )
}
