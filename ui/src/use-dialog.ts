import DialogConfirm from './components/DialogConfirm.vue'
import type { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  variant?: ColorsModifiers
  hasIcon?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export function confirmDialog (parent: any, options: ConfirmOptions) {
  const defaultOptions = {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onConfirm: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onCancel: () => {},
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
  }

  parent.$oruga.modal.open({
    parent,
    component: DialogConfirm,
    props: {
      title: finalOptions.title,
      message: finalOptions.message,
      confirmText: finalOptions.confirmText,
      hasIcon: finalOptions.hasIcon,
      variant: finalOptions.variant,
    },
    events: {
      cancel: finalOptions.onCancel,
      confirm: finalOptions.onConfirm,
    },
    trapFocus: true,
    onCancel: finalOptions.onCancel,
  })
}
