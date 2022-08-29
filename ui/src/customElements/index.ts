import { createCustomElement } from '@/forms/custom-element'
import { Button } from '@oruga-ui/oruga-next'
import BMessage from '@/components/BMessage.vue'

Button.install({
  component (_: string, Component: any) {
    createCustomElement('cc-o-button')(Component)
  }
})

createCustomElement('cc-b-message')(BMessage)
