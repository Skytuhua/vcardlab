import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { type Contact, type MatchOptions, displayName, emptyName } from './core'
import { useContacts } from './state/useContacts'
import { useTheme } from './state/useTheme'
import { useMediaQuery } from './state/useMediaQuery'
import { ConfirmDialog, type ConfirmState } from './components/ConfirmDialog'
import { SAMPLE_VCF } from './lib/sample'
import { Dropzone } from './components/Dropzone'
import { ContactTable } from './components/ContactTable'
import { ContactDetail } from './components/ContactDetail'
import { ExportDialog } from './components/ExportDialog'
import { DuplicatesDialog } from './components/DuplicatesDialog'
import { CleanDialog } from './components/CleanDialog'
import { ToastHost, type ToastItem, type ToastKind } from './components/Toast'
import { Button, IconButton, Badge } from './components/ui'
import {
  ShieldIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
  MergeIcon,
  CleanIcon,
  DownloadIcon,
  TrashIcon,
  PlusIcon,
  GithubIcon,
  AlertIcon,
} from './components/icons'

type Dialog = 'export' | 'duplicates' | 'clean' | null
const REPO_URL = 'https://github.com/Skytuhua/vcardlab'

function matches(c: Contact, q: string): boolean {
  const hay = [
    displayName(c),
    c.fn,
    c.nickname,
    c.title,
    ...(c.org ?? []),
    c.note,
    ...c.emails.map((e) => e.value),
    ...c.phones.map((p) => p.value),
    ...c.urls.map((u) => u.value),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

export default function App() {
  const api = useContacts()
  const { theme, toggle } = useTheme()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [openId, setOpenId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [warnDismissed, setWarnDismissed] = useState(false)

  const addToast = useCallback((message: string, kind: ToastKind = 'success') => {
    setToasts((t) => [...t, { id: Date.now() + Math.random(), kind, message }])
  }, [])
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim()
    return q ? api.contacts.filter((c) => matches(c, q)) : api.contacts
  }, [api.contacts, deferredQuery])

  const selectedContacts = useMemo(
    () => api.contacts.filter((c) => api.selected.has(c.id)),
    [api.contacts, api.selected],
  )
  const openContact = openId ? api.contacts.find((c) => c.id === openId) ?? null : null

  const handleLoad = useCallback(
    (files: { name: string; text: string }[]) => {
      const append = api.contacts.length > 0
      const { added, warnings } = api.loadFiles(files, append)
      setWarnDismissed(false)
      if (added === 0) {
        // Distinguish "this isn't a vCard" from "this vCard was empty".
        const looksLikeVcard = files.some((f) => /BEGIN:VCARD/i.test(f.text))
        if (!looksLikeVcard) {
          const names = files.map((f) => f.name).join(', ')
          addToast(`${names} doesn't look like a vCard (.vcf) file. If it's a CSV, import it to Google or iCloud Contacts first, then export as vCard.`, 'error')
        } else {
          addToast('No contacts found in those files.', 'error')
        }
      } else {
        addToast(`Loaded ${added} contact${added === 1 ? '' : 's'}${warnings ? ` · ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}.`)
      }
    },
    [api, addToast],
  )

  const loadSample = useCallback(() => {
    api.loadFiles([{ name: 'sample.vcf', text: SAMPLE_VCF }], false)
    setWarnDismissed(false)
    addToast('Loaded a sample address book to explore.')
  }, [api, addToast])

  const addBlank = useCallback(() => {
    const c: Contact = {
      id: `c${Date.now().toString(36)}_new`,
      n: emptyName(),
      emails: [],
      phones: [],
      addresses: [],
      urls: [],
      categories: [],
      extra: [],
      sourceVersion: '3.0',
    }
    api.addContact(c)
    setOpenId(c.id)
  }, [api])

  const mergeGroup = useCallback(
    (ids: string[]) => {
      api.mergeGroup(ids)
      addToast(`Merged ${ids.length} contacts into one.`)
    },
    [api, addToast],
  )
  const mergeAll = useCallback(
    (opts: MatchOptions) => {
      const removed = api.mergeAll(opts)
      addToast(removed > 0 ? `Merged and removed ${removed} duplicate${removed === 1 ? '' : 's'}.` : 'No duplicates to merge.')
      if (removed > 0) setDialog(null)
    },
    [api, addToast],
  )

  const visibleWarnings = api.warnings.length
  const hasContacts = api.contacts.length > 0

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Header theme={theme} onToggleTheme={toggle} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        {!hasContacts ? (
          <Hero onFiles={handleLoad} onSample={loadSample} />
        ) : (
          <div className="flex flex-col gap-4">
            <Toolbar
              count={api.contacts.length}
              filteredCount={filtered.length}
              query={query}
              onQuery={setQuery}
              onFiles={handleLoad}
              onAddBlank={addBlank}
              onDuplicates={() => setDialog('duplicates')}
              onClean={() => setDialog('clean')}
              onExport={() => setDialog('export')}
              canUndo={api.canUndo}
              onUndo={() => {
                api.undo()
                addToast('Reverted the last change.', 'info')
              }}
            />

            {visibleWarnings > 0 && !warnDismissed && (
              <WarningBanner count={visibleWarnings} messages={api.warnings.slice(0, 6).map((w) => w.message)} onDismiss={() => setWarnDismissed(true)} />
            )}

            {api.selected.size > 0 && (
              <SelectionBar
                count={api.selected.size}
                onClear={api.clearSelect}
                onSelectAll={api.selectAll}
                onDelete={() => {
                  const n = api.selected.size
                  setConfirm({
                    title: `Delete ${n} contact${n === 1 ? '' : 's'}?`,
                    body: `This removes ${n} selected contact${n === 1 ? '' : 's'} from your working set. You can undo it afterwards.`,
                    confirmLabel: `Delete ${n}`,
                    danger: true,
                    onConfirm: () => {
                      const removed = api.deleteSelected()
                      addToast(`Deleted ${removed} contact${removed === 1 ? '' : 's'}.`, 'info')
                    },
                  })
                }}
              />
            )}

            <div className="rounded-2xl border border-border bg-surface p-1.5 sm:p-2">
              {filtered.length > 0 ? (
                <ContactTable
                  contacts={filtered}
                  selected={api.selected}
                  onToggle={api.toggleSelect}
                  onOpen={setOpenId}
                  query={deferredQuery}
                  isDesktop={isDesktop}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-muted-surface text-muted">
                    <SearchIcon width={22} height={22} />
                  </span>
                  <p className="font-medium text-fg">No contacts match “{query}”</p>
                  <button onClick={() => setQuery('')} className="cursor-pointer text-sm font-medium text-accent hover:underline">
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />

      {openContact && (
        <ContactDetail
          contact={openContact}
          onClose={() => setOpenId(null)}
          onSave={(c) => {
            api.updateContact(c)
            setOpenId(null)
            addToast('Contact updated.')
          }}
          onDelete={(id) => {
            api.deleteOne(id)
            setOpenId(null)
            addToast('Contact deleted.', 'info')
          }}
        />
      )}

      {dialog === 'export' && (
        <ExportDialog
          allContacts={api.contacts}
          selectedContacts={selectedContacts}
          onClose={() => setDialog(null)}
          onDone={(msg) => {
            addToast(msg)
            setDialog(null)
          }}
        />
      )}
      {dialog === 'duplicates' && (
        <DuplicatesDialog contacts={api.contacts} onMergeGroup={mergeGroup} onMergeAll={mergeAll} onClose={() => setDialog(null)} />
      )}
      {dialog === 'clean' && (
        <CleanDialog
          contacts={api.contacts}
          onClose={() => setDialog(null)}
          onApply={(fn, summary) => {
            api.transform(fn)
            addToast(summary)
            setDialog(null)
          }}
        />
      )}

      {confirm && <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

function Logo() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" fill="currentColor" opacity="0.25" />
        <circle cx="9" cy="11" r="2.4" fill="currentColor" />
        <path d="M5.5 16.5c.6-1.7 2-2.5 3.5-2.5s2.9.8 3.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M15 9.5h4M15 12.5h4M15 15.5h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function Header({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Logo />
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-fg">vcardlab</span>
          <span className="hidden text-sm text-muted sm:inline">contacts workbench</span>
        </div>
        <span className="ml-1 hidden sm:inline">
          <Badge tone="success">
            <ShieldIcon width={13} height={13} /> <span className="ml-1">100% local</span>
          </Badge>
        </span>
        <div className="ml-auto flex items-center gap-1">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-muted-surface hover:text-fg cursor-pointer transition-colors duration-150"
          >
            <GithubIcon />
          </a>
          <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={onToggleTheme}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </IconButton>
        </div>
      </div>
    </header>
  )
}

function Hero({ onFiles, onSample }: { onFiles: (f: { name: string; text: string }[]) => void; onSample: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center pt-6 text-center sm:pt-12">
      <Badge tone="success">
        <ShieldIcon width={13} height={13} /> <span className="ml-1">Nothing is uploaded — everything runs in your browser</span>
      </Badge>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        Your contacts workbench
      </h1>
      <p className="mt-3 max-w-xl text-base text-muted sm:text-lg">
        View, edit, de-duplicate, merge, split and convert your <code className="rounded bg-muted-surface px-1.5 py-0.5 text-sm">.vcf</code> address
        book — to vCard, CSV or JSON. Private by design: your contacts never leave your device.
      </p>

      <div className="mt-7 w-full">
        <Dropzone onFiles={onFiles} />
      </div>

      <button onClick={onSample} className="mt-4 cursor-pointer text-sm font-medium text-accent hover:underline">
        or try it with a sample address book (fake contacts — no export needed)
      </button>

      <ExportHelp />

      <ul className="mt-10 grid w-full gap-3 text-left sm:grid-cols-3">
        <Benefit title="De-duplicate" body="Find matches by email, phone or name and merge them cleanly." />
        <Benefit title="Convert & split" body="Export to vCard 2.1/3.0/4.0, CSV or JSON — combined or split." />
        <Benefit title="Fix & clean" body="Repair garbled text, strip photos and tidy formatting." />
      </ul>
    </div>
  )
}

function Benefit({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </li>
  )
}

// Help for first-timers who don't yet have a .vcf file: how to export contacts
// from the common sources. Native <details> — collapsed by default, no extra state.
function ExportHelp() {
  return (
    <details className="mt-6 w-full max-w-xl rounded-xl border border-border bg-surface text-left">
      <summary className="cursor-pointer list-none rounded-xl px-4 py-3 text-sm font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="text-accent">Don’t have a .vcf file yet?</span>{' '}
        <span className="text-muted">How to export your contacts</span>
      </summary>
      <div className="border-t border-border px-4 py-3 text-sm text-muted">
        <ul className="flex flex-col gap-2">
          <li>
            <strong className="text-fg">iPhone / iCloud:</strong> on a computer, open{' '}
            <a href="https://www.icloud.com/contacts" target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
              icloud.com/contacts
            </a>
            , select all contacts, then the settings (gear) icon → <em>Export vCard…</em>
          </li>
          <li>
            <strong className="text-fg">Google / Android:</strong> on a computer, open{' '}
            <a href="https://contacts.google.com" target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
              contacts.google.com
            </a>{' '}
            → <em>Export</em> → choose <em>vCard (.vcf)</em>. (On the phone: Contacts app → Settings → Import/Export → <em>Export to .vcf</em>.)
          </li>
          <li>
            <strong className="text-fg">Outlook:</strong> export your contacts, then import them into Google or iCloud and export as vCard — vcardlab reads vCard <code className="rounded bg-muted-surface px-1 py-0.5 text-xs">.vcf</code> files.
          </li>
        </ul>
        <p className="mt-3">Then drag that .vcf file into the box above.</p>
      </div>
    </details>
  )
}

function Toolbar(props: {
  count: number
  filteredCount: number
  query: string
  onQuery: (q: string) => void
  onFiles: (f: { name: string; text: string }[]) => void
  onAddBlank: () => void
  onDuplicates: () => void
  onClean: () => void
  onExport: () => void
  canUndo: boolean
  onUndo: () => void
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 lg:w-72">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon width={18} height={18} />
          </span>
          <input
            value={props.query}
            onChange={(e) => props.onQuery(e.target.value)}
            placeholder="Search contacts…"
            aria-label="Search contacts"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <span className="whitespace-nowrap text-sm text-muted tnum">
          {props.query ? `${props.filteredCount} / ${props.count}` : `${props.count}`} contacts
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        <Dropzone onFiles={props.onFiles} compact />
        <Button size="md" variant="secondary" onClick={props.onAddBlank}>
          <PlusIcon width={16} height={16} /> New
        </Button>
        <Button size="md" variant="secondary" onClick={props.onDuplicates}>
          <MergeIcon width={16} height={16} /> Duplicates
        </Button>
        <Button size="md" variant="secondary" onClick={props.onClean}>
          <CleanIcon width={16} height={16} /> Clean
        </Button>
        {props.canUndo && (
          <Button size="md" variant="ghost" onClick={props.onUndo}>
            Undo
          </Button>
        )}
        <Button size="md" variant="primary" onClick={props.onExport}>
          <DownloadIcon width={16} height={16} /> Export
        </Button>
      </div>
    </div>
  )
}

function SelectionBar({ count, onClear, onSelectAll, onDelete }: { count: number; onClear: () => void; onSelectAll: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft px-4 py-2.5">
      <span className="text-sm font-medium text-fg tnum">{count} selected</span>
      <button onClick={onSelectAll} className="cursor-pointer text-sm font-medium text-accent hover:underline">
        Select all
      </button>
      <button onClick={onClear} className="cursor-pointer text-sm font-medium text-muted hover:text-fg hover:underline">
        Clear
      </button>
      <div className="ml-auto">
        <Button size="sm" variant="danger" onClick={onDelete}>
          <TrashIcon width={15} height={15} /> Delete selected
        </Button>
      </div>
    </div>
  )
}

function WarningBanner({ count, messages, onDismiss }: { count: number; messages: string[]; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-warning-border bg-warning-soft px-4 py-3 text-sm">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-warning">
          <AlertIcon width={18} height={18} />
        </span>
        <div className="flex-1">
          <p className="font-medium text-warning">
            {count} issue{count === 1 ? '' : 's'} while importing — some cards were skipped or partially read.
          </p>
          <ul className="mt-1 list-inside list-disc text-warning/90">
            {messages.map((m, i) => (
              <li key={i} className="truncate">{m}</li>
            ))}
          </ul>
        </div>
        <button onClick={onDismiss} className="shrink-0 cursor-pointer text-sm font-medium text-warning hover:underline">
          Dismiss
        </button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 py-6 text-center text-sm text-muted sm:px-6">
        <p className="inline-flex items-center gap-1.5">
          <ShieldIcon width={14} height={14} className="text-success" />
          All processing happens locally in your browser. No servers, no tracking, no uploads.
        </p>
        <p>
          Open source under MIT ·{' '}
          <a href={REPO_URL} target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
            View on GitHub
          </a>
        </p>
      </div>
    </footer>
  )
}
