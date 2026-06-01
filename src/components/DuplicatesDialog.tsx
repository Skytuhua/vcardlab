// Find & merge duplicate contacts. Recomputes groups live from the current working set.
import { useMemo, useState } from 'react'
import {
  type Contact,
  type MatchOptions,
  findDuplicates,
  defaultMatchOptions,
  displayName,
} from '../core'
import { Modal } from './Modal'
import { Button } from './ui'
import { MergeIcon, CheckIcon } from './icons'

interface Props {
  contacts: Contact[]
  onMergeGroup: (ids: string[]) => void
  onMergeAll: (opts: MatchOptions) => void
  onClose: () => void
}

export function DuplicatesDialog({ contacts, onMergeGroup, onMergeAll, onClose }: Props) {
  const [opts, setOpts] = useState<MatchOptions>(defaultMatchOptions)
  const groups = useMemo(() => findDuplicates(contacts, opts), [contacts, opts])
  const dupTotal = groups.reduce((s, g) => s + (g.ids.length - 1), 0)

  function toggle(key: keyof MatchOptions) {
    setOpts((o) => {
      const next = { ...o, [key]: !o[key] }
      // Always keep at least one criterion enabled.
      if (!next.byEmail && !next.byPhone && !next.byName) return o
      return next
    })
  }

  return (
    <Modal
      title="Find duplicates"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">
            {groups.length === 0
              ? 'No duplicates found'
              : `${groups.length} group${groups.length === 1 ? '' : 's'} · ${dupTotal} duplicate${dupTotal === 1 ? '' : 's'} to remove`}
          </span>
          <Button variant="primary" onClick={() => onMergeAll(opts)} disabled={groups.length === 0}>
            <MergeIcon width={18} height={18} /> Merge all
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-muted-surface px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Match by</span>
        <Check label="Email" checked={opts.byEmail} onChange={() => toggle('byEmail')} />
        <Check label="Phone" checked={opts.byPhone} onChange={() => toggle('byPhone')} />
        <Check label="Name" checked={opts.byName} onChange={() => toggle('byName')} />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
            <CheckIcon width={24} height={24} />
          </span>
          <p className="font-medium text-fg">No duplicates with these criteria</p>
          <p className="max-w-sm text-sm text-muted">Try matching by name as well, or your list is already clean.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((g) => (
            <li key={g.ids.join('-')} className="rounded-xl border border-border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-fg">{displayName(g.contacts[0])}</span>
                <Button variant="secondary" size="sm" onClick={() => onMergeGroup(g.ids)}>
                  <MergeIcon width={15} height={15} /> Merge {g.ids.length}
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                {g.contacts.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md bg-muted-surface px-2.5 py-1.5 text-xs text-muted">
                    <span className="font-medium text-fg">{displayName(c)}</span>
                    {c.emails[0] && <span>{c.emails[0].value}</span>}
                    {c.phones[0] && <span className="tnum">{c.phones[0].value}</span>}
                    {c.org?.[0] && <span>{c.org[0]}</span>}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-fg">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
      {label}
    </label>
  )
}
