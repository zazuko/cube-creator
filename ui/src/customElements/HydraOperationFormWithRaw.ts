import { html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { HydraOperationFormBase } from '@/customElements/HydraOperationFormBase'
import type { HydraOperationForm } from './HydraOperationForm'
import type { HydraRawRdfForm } from './HydraRawRdfForm'
import './HydraOperationForm'
import './HydraRawRdfForm'

@customElement('cc-hydra-operation-form-with-raw')
export class HydraOperationFormWithRaw extends HydraOperationFormBase {
  @property({ type: Boolean })
  sourceMode = false

  @query('cc-hydra-raw-rdf-form')
  editor!: HydraRawRdfForm

  @query('cc-hydra-operation-form')
  form!: HydraOperationForm

  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }

  protected renderForm () {
    if (this.sourceMode) {
      return html`
        <cc-hydra-raw-rdf-form
          .operation="${this.operation}"
          .resource="${this.resource}"
          .shape="${this.shape}"
          .error="${this.error}"
          .submitting="${this.submitting}"
          submit-label="${this.submitLabel}"
          .show-cancel="${this.showCancel}"
        ></cc-hydra-raw-rdf-form>
        <div class="mt-4 has-text-right">
          <cc-o-button @click="${this.toggleMode}" icon-left="chevron-left" label="Back to form (basic)">
          </cc-o-button>
        </div>
      `
    }

    return html`
      <cc-hydra-operation-form
        .operation="${this.operation}"
        .resource="${this.resource}"
        .shape="${this.shape}"
        .error="${this.error}"
        .submitting="${this.submitting}"
        submit-label="${this.submitLabel}"
        .show-cancel="${this.showCancel}"
      ></cc-hydra-operation-form>
      <div class="mt-4 has-text-right">
        <cc-o-button icon-right="exclamation-triangle" @click="${this.toggleMode}" variant="text" label="Edit raw RDF (advanced)">
        </cc-o-button>
      </div>
    `
  }

  toggleMode () {
    if (this.sourceMode) {
      this.resource = this.editor.value
    } else {
      this.resource = this.form.value
    }

    this.sourceMode = !this.sourceMode
  }
}
