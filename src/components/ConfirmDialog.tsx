// Confirmation dialog for destructive, hard-to-eyeball bulk actions (merge all, delete many).
import { Modal } from './Modal'
import { Button } from './ui'

export interface ConfirmState {
  title: string
  body: string
  confirmLabel: string
  danger?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  return (
    <Modal
      title={state.title}
      onClose={onClose}
      width="max-w-sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={state.danger ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              state.onConfirm()
              onClose()
            }}
          >
            {state.confirmLabel}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted">{state.body}</p>
    </Modal>
  )
}
