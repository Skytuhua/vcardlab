// View + edit a single contact in a modal. Edits are local until "Save changes".
import { useState } from 'react'
import { type Address, type Contact, type StructuredName, type TypedValue, displayName, emptyName } from '../core'
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Birthday">
            <TextInput value={draft.birthday ?? ''} placeholder="YYYY-MM-DD" onChange={(e) => patch({ birthday: e.target.value })} />
          </Field>
          <Field label="Nickname">
            <TextInput value={draft.nickname ?? ''} onChange={(e) => patch({ nickname: e.target.value })} />
          </Field>
        </div>

        <AddressEditor addresses={draft.addresses} onChange={(addresses) => patch({ addresses })} />

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
  const photo = contact.photo
  if (!photo) return null
  // Privacy: never auto-load a remote (http/https) photo URL — that would beacon the user's
  // IP and break the "nothing leaves your device" guarantee. Only inline/data images render.
  if (photo.isUri && /^https?:/i.test(photo.data)) {
    return (
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-muted-surface text-[10px] leading-tight text-muted">
        remote
      </span>
    )
  }
  const src = photo.isUri
    ? photo.data
    : `data:${(photo.mediaType || 'image/jpeg').includes('/') ? photo.mediaType : 'image/' + (photo.mediaType || 'jpeg').toLowerCase()};base64,${photo.data}`
  // Guard against rendering an enormous inline blob.
  if (!photo.isUri && photo.data.length > 4_000_000) {
    return (
      <span className="grid h-12 w-12 place-items-center rounded-lg bg-muted-surface text-[10px] leading-tight text-muted">
        large
      </span>
    )
  }
  return <img src={src} alt="" className="h-12 w-12 rounded-lg object-cover" />
}

const EMPTY_ADDRESS: Address = {
  types: ['HOME'],
  poBox: '',
  ext: '',
  street: '',
  locality: '',
  region: '',
  postal: '',
  country: '',
}

function AddressEditor({ addresses, onChange }: { addresses: Address[]; onChange: (a: Address[]) => void }) {
  function update(i: number, p: Partial<Address>) {
    onChange(addresses.map((a, idx) => (idx === i ? { ...a, ...p } : a)))
  }
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">Addresses</span>
      <div className="flex flex-col gap-3">
        {addresses.map((a, i) => (
          <div key={i} className="rounded-lg border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Address {i + 1}</span>
              <button
                onClick={() => onChange(addresses.filter((_, idx) => idx !== i))}
                aria-label="Remove address"
                className="grid h-7 w-7 cursor-pointer place-items-center rounded-md text-muted hover:bg-destructive-soft hover:text-destructive"
              >
                <TrashIcon width={15} height={15} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <TextInput value={a.street} placeholder="Street" onChange={(e) => update(i, { street: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={a.locality} placeholder="City" onChange={(e) => update(i, { locality: e.target.value })} />
                <TextInput value={a.region} placeholder="State / region" onChange={(e) => update(i, { region: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <TextInput value={a.postal} placeholder="Postal code" onChange={(e) => update(i, { postal: e.target.value })} />
                <TextInput value={a.country} placeholder="Country" onChange={(e) => update(i, { country: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => onChange([...addresses, { ...EMPTY_ADDRESS }])}
          className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft cursor-pointer"
        >
          <PlusIcon width={15} height={15} /> Add address
        </button>
      </div>
    </div>
  )
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
