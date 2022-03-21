import { useProgrammatic } from '@oruga-ui/oruga-next'
import type { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import DialogConfirm from './components/DialogConfirm.vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  variant?: ColorsModifiers
  hasIcon?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export function confirmDialog (options: ConfirmOptions) {
  const { oruga } = useProgrammatic()

  oruga.modal.open({
    component: DialogConfirm,
    props: {
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      hasIcon: options.hasIcon,
      variant: options.variant,
    },
    events: {
      cancel: options.onCancel,
      confirm: options.onConfirm,
    },
    trapFocus: true,
    onCancel: options.onCancel,
  })
}
