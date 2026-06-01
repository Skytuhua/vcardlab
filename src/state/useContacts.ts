// Central working-set state: the contact list, selection, parse warnings, and a one-level
// undo history for destructive operations. Pure-core functions do the actual work.

import { useCallback, useMemo, useReducer } from 'react'
import {
  type Contact,
  type ParseWarning,
  parseVcf,
  mergeAllDuplicates,
  mergeContacts,
  type MatchOptions,
  findDuplicates,
} from '../core'

interface State {
  contacts: Contact[]
  selected: Set<string>
  warnings: ParseWarning[]
  history: Contact[][]
}

type Action =
  | { type: 'load'; contacts: Contact[]; warnings: ParseWarning[]; append: boolean }
  | { type: 'setContacts'; contacts: Contact[]; record: boolean }
  | { type: 'toggleSelect'; id: string }
  | { type: 'selectAll'; ids: string[] }
  | { type: 'clearSelect' }
  | { type: 'undo' }
  | { type: 'reset' }

const initialState: State = { contacts: [], selected: new Set(), warnings: [], history: [] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load': {
      const contacts = action.append ? [...state.contacts, ...action.contacts] : action.contacts
      const warnings = action.append ? [...state.warnings, ...action.warnings] : action.warnings
      return {
        contacts,
        warnings,
        selected: new Set(),
        history: action.append ? [...state.history, state.contacts] : [],
      }
    }
    case 'setContacts': {
      return {
        ...state,
        contacts: action.contacts,
        selected: new Set(),
        history: action.record ? [...state.history, state.contacts] : state.history,
      }
    }
    case 'toggleSelect': {
      const selected = new Set(state.selected)
      if (selected.has(action.id)) selected.delete(action.id)
      else selected.add(action.id)
      return { ...state, selected }
    }
    case 'selectAll':
      return { ...state, selected: new Set(action.ids) }
    case 'clearSelect':
      return { ...state, selected: new Set() }
    case 'undo': {
      if (state.history.length === 0) return state
      const history = [...state.history]
      const previous = history.pop()!
      return { ...state, contacts: previous, selected: new Set(), history }
    }
    case 'reset':
      return initialState
    default:
      return state
  }
}

export interface ContactsApi {
  contacts: Contact[]
  selected: Set<string>
  warnings: ParseWarning[]
  canUndo: boolean
  count: number
  /** Parse and load one or more vCard file contents. */
  loadFiles: (files: { name: string; text: string }[], append: boolean) => { added: number; warnings: number }
  /** Replace the whole working set, recording undo. */
  setContacts: (contacts: Contact[]) => void
  /** Apply a transform over the working set, recording undo. Returns the new count. */
  transform: (fn: (cs: Contact[]) => Contact[]) => number
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelect: () => void
  deleteSelected: () => number
  deleteOne: (id: string) => void
  addContact: (c: Contact) => void
  updateContact: (c: Contact) => void
  mergeGroup: (ids: string[]) => void
  mergeAll: (opts: MatchOptions) => number
  duplicateCount: (opts: MatchOptions) => number
  undo: () => void
  reset: () => void
}

export function useContacts(): ContactsApi {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadFiles: ContactsApi['loadFiles'] = useCallback((files, append) => {
    const allContacts: Contact[] = []
    const allWarnings: ParseWarning[] = []
    for (const f of files) {
      const { contacts, warnings } = parseVcf(f.text)
      allContacts.push(...contacts)
      for (const w of warnings) allWarnings.push({ ...w, message: `${f.name}: ${w.message}` })
    }
    dispatch({ type: 'load', contacts: allContacts, warnings: allWarnings, append })
    return { added: allContacts.length, warnings: allWarnings.length }
  }, [])

  const setContacts = useCallback((contacts: Contact[]) => {
    dispatch({ type: 'setContacts', contacts, record: true })
  }, [])

  // Apply a transform computed from the current snapshot, recording undo.
  const transform: ContactsApi['transform'] = useCallback(
    (fn) => {
      const next = fn(state.contacts)
      dispatch({ type: 'setContacts', contacts: next, record: true })
      return next.length
    },
    [state.contacts],
  )

  const deleteSelected = useCallback(() => {
    const removed = state.selected.size
    const next = state.contacts.filter((c) => !state.selected.has(c.id))
    dispatch({ type: 'setContacts', contacts: next, record: true })
    return removed
  }, [state.contacts, state.selected])

  const deleteOne = useCallback(
    (id: string) => {
      const next = state.contacts.filter((c) => c.id !== id)
      dispatch({ type: 'setContacts', contacts: next, record: true })
    },
    [state.contacts],
  )

  const addContact = useCallback(
    (c: Contact) => {
      dispatch({ type: 'setContacts', contacts: [c, ...state.contacts], record: true })
    },
    [state.contacts],
  )

  const updateContact = useCallback(
    (c: Contact) => {
      const next = state.contacts.map((x) => (x.id === c.id ? c : x))
      dispatch({ type: 'setContacts', contacts: next, record: true })
    },
    [state.contacts],
  )

  const mergeGroup = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids)
      const group = state.contacts.filter((c) => idSet.has(c.id))
      if (group.length < 2) return
      const merged = mergeContacts(group)
      const next: Contact[] = []
      let inserted = false
      for (const c of state.contacts) {
        if (idSet.has(c.id)) {
          if (!inserted) {
            next.push(merged)
            inserted = true
          }
        } else {
          next.push(c)
        }
      }
      dispatch({ type: 'setContacts', contacts: next, record: true })
    },
    [state.contacts],
  )

  const mergeAll = useCallback(
    (opts: MatchOptions) => {
      const before = state.contacts.length
      const next = mergeAllDuplicates(state.contacts, opts)
      dispatch({ type: 'setContacts', contacts: next, record: true })
      return before - next.length
    },
    [state.contacts],
  )

  const duplicateCount = useCallback(
    (opts: MatchOptions) => {
      const groups = findDuplicates(state.contacts, opts)
      return groups.reduce((sum, g) => sum + (g.ids.length - 1), 0)
    },
    [state.contacts],
  )

  return useMemo<ContactsApi>(
    () => ({
      contacts: state.contacts,
      selected: state.selected,
      warnings: state.warnings,
      canUndo: state.history.length > 0,
      count: state.contacts.length,
      loadFiles,
      setContacts,
      transform,
      toggleSelect: (id) => dispatch({ type: 'toggleSelect', id }),
      selectAll: () => dispatch({ type: 'selectAll', ids: state.contacts.map((c) => c.id) }),
      clearSelect: () => dispatch({ type: 'clearSelect' }),
      deleteSelected,
      deleteOne,
      addContact,
      updateContact,
      mergeGroup,
      mergeAll,
      duplicateCount,
      undo: () => dispatch({ type: 'undo' }),
      reset: () => dispatch({ type: 'reset' }),
    }),
    [
      state,
      loadFiles,
      setContacts,
      transform,
      deleteSelected,
      deleteOne,
      addContact,
      updateContact,
      mergeGroup,
      mergeAll,
      duplicateCount,
    ],
  )
}
