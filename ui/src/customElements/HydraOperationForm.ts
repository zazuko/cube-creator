import { html, PropertyValues } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import clownface, { GraphPointer } from 'clownface'
import './FormSubmitCancel'
import './LoadingBlock'
import './HydraOperationError'
import { ColorsModifiers } from '@oruga-ui/oruga/types/helpers'
import $rdf from 'rdf-ext'
import { HydraOperationFormBase } from '@/customElements/HydraOperationFormBase'

@customElement('cc-hydra-operation-form')
export class HydraOperationForm extends HydraOperationFormBase {
  @property({ type: String })
  submitButtonVariant?: ColorsModifiers = 'primary'

  @property({ type: Object })
  value?: GraphPointer | null

  @property({ type: Boolean })
  inline = false

  @property({ type: Boolean })
  clearable = false

  constructor () {
    super()
    this.addEventListener('submit', (e) => {
      if (e.target instanceof HTMLFormElement) {
        e.preventDefault()
        this.onSubmit()
      }
    })
  }

  protected updated (_changedProperties: PropertyValues) {
    if (_changedProperties.has('resource')) {
      this.value = clone(this.resource)
    }
  }

  renderForm () {
    return html`
      <form style="${styleMap(this.wrapperStyle)}">
        <cc-form style="${styleMap(this.formStyle)}" .resource="${this.value}" .shapes="${this.shape!.pointer}" no-editor-switches ></cc-form>

        <cc-hydra-operation-error .error="${this.error}" .shape="${this.shape}" class="mt-4" ></cc-hydra-operation-error>

        <div style="display: flex; flex-direction: row-reverse; justify-content: flex-start;">
          <cc-form-submit-cancel
            ?inline="${this.inline}"
            submit-label="${this._submitLabel}"
            .isSubmitting="${this.submitting}"
            .showClear="${this.clearable}"
            .showCancel="${this.showCancel}"
            submit-button-variant="${this.submitButtonVariant}"
            .disabled="${!this.shape}"
            @submit="${this.onSubmit}"
            @clear="${this.onClear}"
            @cancel="${this.onCancel}"
          ></cc-form-submit-cancel>
        </div>
      </form>`
  }

  get wrapperStyle () {
    if (this.inline) {
      return {
        display: 'flex',
        '--cc-form-group-display': 'flex',
        '--cc-form-group-justify-content': 'space-around',
        '--cc-form-property-flex-grow': '1'
      }
    }

    return {}
  }

  get formStyle () {
    if (this.inline) {
      return {
        'flex-grow': '1'
      }
    }

    return {}
  }

  onCancel () {
    this.dispatchEvent(new Event('cancel', { bubbles: true, composed: true }))
  }

  onClear () {
    this.value = clownface({ dataset: $rdf.dataset() }).blankNode()
  }

  onSubmit () {
    this.dispatchEvent(new CustomEvent('submit', {
      detail: {
        value: this.value,
      },
      bubbles: true,
      composed: true
    }))
  }
}

function clone (resource: GraphPointer | undefined | null) {
  if (!resource) {
    return null
  }

  const { graph } = resource._context[0]

  const clone = $rdf.dataset([
    ...resource.dataset.match(null, null, null, graph)
  ])

  return clownface({
    dataset: clone,
    term: resource.term,
    graph,
  })
}
