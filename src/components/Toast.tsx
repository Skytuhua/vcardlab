// Lightweight toast notifications. Auto-dismiss; ARIA live region for screen readers.
import { useEffect } from 'react'
import { CheckIcon, AlertIcon, CloseIcon } from './icons'

export type ToastKind = 'success' | 'error' | 'info'
export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

export function ToastHost({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4200)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const tone =
    toast.kind === 'success'
      ? 'border-success/40 text-success'
      : toast.kind === 'error'
        ? 'border-destructive/40 text-destructive'
        : 'border-border text-fg'

  return (
    <div
      className={`pointer-events-auto flex max-w-[90vw] items-center gap-3 rounded-xl border bg-surface px-4 py-3 shadow-lg ${tone}`}
      role={toast.kind === 'error' ? 'alert' : 'status'}
    >
      <span className="shrink-0">
        {toast.kind === 'error' ? <AlertIcon width={18} height={18} /> : <CheckIcon width={18} height={18} />}
      </span>
      <span className="text-sm font-medium text-fg">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="ml-1 shrink-0 cursor-pointer rounded p-1 text-muted hover:text-fg"
      >
        <CloseIcon width={15} height={15} />
      </button>
    </div>
  )
}
