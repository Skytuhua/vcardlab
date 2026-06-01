// The primary surface: a dense, scannable contact list. Renders a table on >= md and a
// stacked card layout on small screens (design-system anti-pattern: wide tables on mobile).
import { memo } from 'react'
import { type Contact, displayName } from '../core'
import { UserIcon, MailIcon, PhoneIcon } from './icons'

interface Props {
  contacts: Contact[]
  selected: Set<string>
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  query: string
}

function highlightCount(c: Contact) {
  return { emails: c.emails.length, phones: c.phones.length }
}

export const ContactTable = memo(function ContactTable({ contacts, selected, onToggle, onOpen, query }: Props) {
  return (
    <div>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="w-10 px-3 py-2.5"></th>
              <th className="px-3 py-2.5">Name</th>
              <th className="px-3 py-2.5">Organization</th>
              <th className="px-3 py-2.5">Email</th>
              <th className="px-3 py-2.5">Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => {
              const counts = highlightCount(c)
              const isSel = selected.has(c.id)
              return (
                <tr
                  key={c.id}
                  className={`group cursor-pointer border-b border-border/70 transition-colors duration-150 ${
                    isSel ? 'bg-accent-soft' : 'hover:bg-muted-surface'
                  }`}
                  onClick={() => onOpen(c.id)}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => onToggle(c.id)}
                      aria-label={`Select ${displayName(c)}`}
                      className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted-surface text-muted">
                        <UserIcon width={16} height={16} />
                      </span>
                      <span className="font-medium text-fg">{mark(displayName(c), query)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{(c.org ?? []).filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-3 py-2.5 text-muted">
                    {c.emails[0] ? (
                      <span>
                        {mark(c.emails[0].value, query)}
                        {counts.emails > 1 && <span className="ml-1 text-xs text-muted">+{counts.emails - 1}</span>}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted tnum">
                    {c.phones[0] ? (
                      <span>
                        {mark(c.phones[0].value, query)}
                        {counts.phones > 1 && <span className="ml-1 text-xs text-muted">+{counts.phones - 1}</span>}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="flex flex-col gap-2 md:hidden">
        {contacts.map((c) => {
          const isSel = selected.has(c.id)
          return (
            <li
              key={c.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors duration-150 ${
                isSel ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
              }`}
            >
              <input
                type="checkbox"
                checked={isSel}
                onChange={() => onToggle(c.id)}
                aria-label={`Select ${displayName(c)}`}
                className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
              />
              <button className="flex-1 cursor-pointer text-left" onClick={() => onOpen(c.id)}>
                <div className="font-medium text-fg">{mark(displayName(c), query)}</div>
                <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted">
                  {c.emails[0] && (
                    <span className="inline-flex items-center gap-1.5">
                      <MailIcon width={13} height={13} /> {c.emails[0].value}
                    </span>
                  )}
                  {c.phones[0] && (
                    <span className="inline-flex items-center gap-1.5 tnum">
                      <PhoneIcon width={13} height={13} /> {c.phones[0].value}
                    </span>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
})

// Highlight the matched query substring within a cell value.
function mark(text: string, query: string) {
  const q = query.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-accent/20 px-0.5 text-fg">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  )
}
