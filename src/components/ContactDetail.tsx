// View + edit a single contact in a modal. Edits are local until "Save changes".
import { useState } from 'react'
import { type Contact, type StructuredName, type TypedValue, displayName, emptyName } from '../core'
import { Modal } from './Modal'
import { Button, Field, TextInput } from './ui'
import { TrashIcon, PlusIcon } from './icons'

interface Props {
  contact: Contact
  onClose: () => void
  onSave: (c: Contact) => void
  onDelete: (id: string) => void
}

const PHONE_TYPES = ['CELL', 'HOME', 'WORK', 'MAIN', 'FAX', 'OTHER']
const EMAIL_TYPES = ['HOME', 'WORK', 'OTHER']

export function ContactDetail({ contact, onClose, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Contact>(() => structuredClone(contact))

  function patch(p: Partial<Contact>) {
    setDraft((d) => ({ ...d, ...p }))
  }
  function patchName(field: keyof StructuredName, value: string) {
    setDraft((d) => ({ ...d, n: { ...(d.n ?? emptyName()), [field]: value } }))
  }

  function save() {
    const next = { ...draft }
    // Keep FN in sync if a structured name was provided but FN is empty.
    if (!next.fn?.trim() && next.n) {
      const composed = [next.n.given, next.n.family].filter(Boolean).join(' ').trim()
      if (composed) next.fn = composed
    }
    onSave(next)
  }

  return (
    <Modal
      title={displayName(contact)}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <div className="flex items-center justify-between">
          <Button variant="danger" size="sm" onClick={() => onDelete(contact.id)}>
            <TrashIcon width={16} height={16} /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={save}>
              Save changes
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {draft.photo && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted-surface p-3">
            <PhotoPreview contact={draft} />
            <div className="flex-1">
              <p className="text-sm font-medium text-fg">Embedded photo</p>
              <p className="text-xs text-muted">Photos can carry metadata and bloat file size.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => patch({ photo: null })}>
              Remove photo
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <TextInput value={draft.n?.given ?? ''} onChange={(e) => patchName('given', e.target.value)} />
          </Field>
          <Field label="Last name">
            <TextInput value={draft.n?.family ?? ''} onChange={(e) => patchName('family', e.target.value)} />
          </Field>
        </div>
        <Field label="Display name (FN)">
          <TextInput
            value={draft.fn ?? ''}
            placeholder="Auto from first + last if left blank"
            onChange={(e) => patch({ fn: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Organization">
            <TextInput
              value={(draft.org ?? []).join(', ')}
              onChange={(e) => patch({ org: e.target.value ? e.target.value.split(',').map((s) => s.trim()) : undefined })}
            />
          </Field>
          <Field label="Title">
            <TextInput value={draft.title ?? ''} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
        </div>

        <TypedListEditor
          label="Email"
          items={draft.emails}
          types={EMAIL_TYPES}
          placeholder="name@example.com"
          onChange={(emails) => patch({ emails })}
        />
        <TypedListEditor
          label="Phone"
          items={draft.phones}
          types={PHONE_TYPES}
          placeholder="+1 555 010 0100"
          onChange={(phones) => patch({ phones })}
        />
        <TypedListEditor
          label="Website"
          items={draft.urls}
          types={['HOME', 'WORK', 'OTHER']}
          placeholder="https://example.com"
          onChange={(urls) => patch({ urls })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Birthday">
            <TextInput value={draft.birthday ?? ''} placeholder="YYYY-MM-DD" onChange={(e) => patch({ birthday: e.target.value })} />
          </Field>
          <Field label="Nickname">
            <TextInput value={draft.nickname ?? ''} onChange={(e) => patch({ nickname: e.target.value })} />
          </Field>
        </div>

        {draft.addresses.length > 0 && (
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">Addresses</span>
            <div className="flex flex-col gap-2">
              {draft.addresses.map((a, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted-surface px-3 py-2 text-sm text-fg">
                  {[a.street, a.locality, a.region, a.postal, a.country].filter(Boolean).join(', ') || '(empty address)'}
                </div>
              ))}
            </div>
          </div>
        )}

        <Field label="Notes">
          <textarea
            value={draft.note ?? ''}
            onChange={(e) => patch({ note: e.target.value })}
            rows={3}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>
      </div>
    </Modal>
  )
}

function PhotoPreview({ contact }: { contact: Contact }) {
  if (!contact.photo) return null
  const src = contact.photo.isUri
    ? contact.photo.data
    : `data:${(contact.photo.mediaType || 'image/jpeg').includes('/') ? contact.photo.mediaType : 'image/' + (contact.photo.mediaType || 'jpeg').toLowerCase()};base64,${contact.photo.data}`
  return <img src={src} alt="" className="h-12 w-12 rounded-lg object-cover" />
}

interface TypedListProps {
  label: string
  items: TypedValue[]
  types: string[]
  placeholder: string
  onChange: (items: TypedValue[]) => void
}

function TypedListEditor({ label, items, types, placeholder, onChange }: TypedListProps) {
  function update(i: number, p: Partial<TypedValue>) {
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
  }
  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i))
  }
  function add() {
    onChange([...items, { value: '', types: [types[0]] }])
  }
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              value={it.types[0] ?? types[0]}
              onChange={(e) => update(i, { types: [e.target.value] })}
              aria-label={`${label} type`}
              className="h-9 shrink-0 cursor-pointer rounded-md border border-border bg-surface px-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t[0] + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <TextInput value={it.value} placeholder={placeholder} onChange={(e) => update(i, { value: e.target.value })} />
            <button
              onClick={() => remove(i)}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-md text-muted hover:bg-destructive-soft hover:text-destructive"
            >
              <TrashIcon width={16} height={16} />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft cursor-pointer"
        >
          <PlusIcon width={15} height={15} /> Add {label.toLowerCase()}
        </button>
      </div>
    </div>
  )
}
