// The primary surface: a dense, scannable, *virtualized* contact list that stays smooth with
// large address books. Renders aligned rows on >= md and stacked cards on small screens
// (avoids the wide-table-on-mobile anti-pattern). Rows are keyboard-accessible buttons.
import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { type Contact, displayName } from '../core'
import { UserIcon, MailIcon, PhoneIcon } from './icons'

interface Props {
  contacts: Contact[]
  selected: Set<string>
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  query: string
  isDesktop: boolean
}

// Shared column template so the header and desktop rows line up exactly.
const COLS = 'grid grid-cols-[2.5rem_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center'

export function ContactTable({ contacts, selected, onToggle, onOpen, query, isDesktop }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  // TanStack Virtual returns fresh function instances by design; the compiler-compat lint
  // flags this as "unmemoizable", which is expected and safe here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (isDesktop ? 49 : 82),
    overscan: 10,
  })
  const items = virtualizer.getVirtualItems()

  return (
    <div>
      {isDesktop && (
        <div className={`${COLS} border-b border-border px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted`}>
          <span aria-hidden="true" />
          <span>Name</span>
          <span>Organization</span>
          <span>Email</span>
          <span>Phone</span>
        </div>
      )}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 16rem)' }}
        role="list"
        aria-label="Contacts"
      >
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
          {items.map((vi) => {
            const c = contacts[vi.index]
            return (
              <div
                key={c.id}
                role="listitem"
                ref={virtualizer.measureElement}
                data-index={vi.index}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
              >
                {isDesktop ? (
                  <DesktopRow c={c} selected={selected.has(c.id)} onToggle={onToggle} onOpen={onOpen} query={query} />
                ) : (
                  <MobileCard c={c} selected={selected.has(c.id)} onToggle={onToggle} onOpen={onOpen} query={query} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  c: Contact
  selected: boolean
  onToggle: (id: string) => void
  onOpen: (id: string) => void
  query: string
}

function DesktopRow({ c, selected, onToggle, onOpen, query }: RowProps) {
  return (
    <div
      className={`${COLS} border-b border-border/70 transition-colors duration-150 ${selected ? 'bg-accent-soft' : 'hover:bg-muted-surface'}`}
    >
      <div className="px-3 py-2.5">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(c.id)}
          aria-label={`Select ${displayName(c)}`}
          className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
        />
      </div>
      <button
        onClick={() => onOpen(c.id)}
        className="flex min-w-0 cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left"
        aria-label={`Open ${displayName(c)}`}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted-surface text-muted">
          <UserIcon width={16} height={16} />
        </span>
        <span className="truncate font-medium text-fg">{mark(displayName(c), query)}</span>
      </button>
      <Cell>{(c.org ?? []).filter(Boolean).join(', ') || '—'}</Cell>
      <Cell>
        {c.emails[0] ? (
          <>
            {mark(c.emails[0].value, query)}
            {c.emails.length > 1 && <span className="ml-1 text-xs">+{c.emails.length - 1}</span>}
          </>
        ) : (
          '—'
        )}
      </Cell>
      <Cell mono>
        {c.phones[0] ? (
          <>
            {mark(c.phones[0].value, query)}
            {c.phones.length > 1 && <span className="ml-1 text-xs">+{c.phones.length - 1}</span>}
          </>
        ) : (
          '—'
        )}
      </Cell>
    </div>
  )
}

function Cell({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return <div className={`truncate px-3 py-2.5 text-sm text-muted ${mono ? 'tnum' : ''}`}>{children}</div>
}

function MobileCard({ c, selected, onToggle, onOpen, query }: RowProps) {
  return (
    <div
      className={`mb-2 flex items-center gap-3 rounded-xl border p-3 transition-colors duration-150 ${selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(c.id)}
        aria-label={`Select ${displayName(c)}`}
        className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
      />
      <button className="min-w-0 flex-1 cursor-pointer text-left" onClick={() => onOpen(c.id)} aria-label={`Open ${displayName(c)}`}>
        <div className="truncate font-medium text-fg">{mark(displayName(c), query)}</div>
        <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted">
          {c.emails[0] && (
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <MailIcon width={13} height={13} className="shrink-0" /> <span className="truncate">{c.emails[0].value}</span>
            </span>
          )}
          {c.phones[0] && (
            <span className="inline-flex items-center gap-1.5 tnum">
              <PhoneIcon width={13} height={13} className="shrink-0" /> {c.phones[0].value}
            </span>
          )}
        </div>
      </button>
    </div>
  )
}

// Highlight the matched query substring within a cell value.
function mark(text: string, query: string): ReactNode {
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
