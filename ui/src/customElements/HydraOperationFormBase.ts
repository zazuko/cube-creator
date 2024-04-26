import { html, LitElement, TemplateResult } from 'lit'
import { property } from 'lit/decorators.js'
import { RuntimeOperation } from 'alcaeus'
import { Shape } from '@rdfine/shacl'
import type { GraphPointer } from 'clownface'
import { ErrorDetails } from '@/api/errors'
import './LoadingBlock'

export abstract class HydraOperationFormBase extends LitElement {
  @property({ type: Object })
  operation?: RuntimeOperation

  @property({ type: Object })
  shape?: Shape

  @property({ type: Object })
  resource?: GraphPointer | null

  @property({ type: Object })
  error?: ErrorDetails

  @property({ type: Boolean, attribute: 'show-cancel' })
  showCancel = false

  @property({ type: Boolean })
  submitting = false

  @property({ type: String, attribute: 'submit-label' })
  submitLabel?: string

  get _submitLabel () {
    return this.submitLabel || this.operation?.title
  }

  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }

  protected render (): unknown {
    if (!this.shape || !this.resource) {
      return html`<cc-loading-block></cc-loading-block>`
    }

    return this.renderForm()
  }

  protected abstract renderForm(): TemplateResult
}
