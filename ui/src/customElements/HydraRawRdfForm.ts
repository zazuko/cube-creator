import { HydraOperationFormBase } from '@/customElements/HydraOperationFormBase'
import { customElement, property, query } from 'lit/decorators.js'
import { html } from 'lit'
import './FormSubmitCancel'
import './HydraOperationError'
import { Quad, Quad_Graph as Graph } from 'rdf-js'
import $rdf from 'rdf-ext'
import clownface from 'clownface'

interface ParseError {
  detail: { error: string }
}

@customElement('cc-hydra-raw-rdf-form')
export class HydraRawRdfForm extends HydraOperationFormBase {
  @query('rdf-editor')
  editor!: any

  @property({ type: String })
  parseError: string | null = null

  @property({ type: Array })
  quads?: Quad[]

  @property({ type: Object })
  graph?: Graph

  constructor () {
    super()
    this.addEventListener('submit', (e) => {
      if (e.target instanceof HTMLFormElement) {
        e.preventDefault()
        this.onSubmit()
      }
    })
  }

  get value () {
    return clownface({
      dataset: $rdf.dataset(this.editor.quads),
      term: this.resource!.term,
    })
  }

  editorPrefixes = ['hydra', 'rdf', 'rdfs', 'schema', 'xsd'].join(',')

  protected renderForm () {
    return html`
        <rdf-editor
          format="text/turtle"
          .prefixes="${this.editorPrefixes}"
          @quads-changed="${this.onParseSuccess}"
          @parsing-failed="${this.onParseError}"
        ></rdf-editor>

        <cc-b-message ?hidden="${!this.parseError}" type="is-danger"
                      title="Parse error"
                      text="${this.parseError}"
                      class="error-message mt-4">
        </cc-b-message>

        <cc-hydra-operation-error .error="${this.error}" .shape="${this.shape}" class="mt-4" ></cc-hydra-operation-error>

        <cc-form-submit-cancel
          submit-label="${this._submitLabel}"
          .submitting="${this.submitting}"
          .showCancel="${this.showCancel}"
          ?disabled="${!this.shape}"
          @submit="${this.onSubmit}"
          @cancel="${this.dispatchEvent(new Event('cancel'))}"
        ></cc-form-submit-cancel>`
  }

  protected firstUpdated () {
    if (this.resource) {
      this.graph = this.resource._context[0].graph

      const quads = [...this.resource.dataset.match(null, null, null, this.graph)]
      this.editor.quads = quads.map(({ subject, predicate, object }) => $rdf.quad(subject, predicate, object))
    }
  }

  async onSubmit (): Promise<void> {
    await this.waitParsing()

    this.dispatchEvent(new CustomEvent('submit', {
      detail: {
        value: this.value
      },
      bubbles: true,
      composed: true
    }))
  }

  onParseSuccess (): void {
    this.parseError = null
  }

  onParseError ({ detail: { error } }: ParseError): void {
    this.parseError = error
  }

  async waitParsing (): Promise<void> {
    const editor = this.editor

    return new Promise((resolve, reject) => {
      const parsingComplete = () => {
        editor.removeEventListener('quads-changed', parsingComplete)
        editor.removeEventListener('parsing-failed', parsingFailed)
        resolve()
      }

      const parsingFailed = (e: ParseError) => {
        editor.removeEventListener('quads-changed', parsingComplete)
        editor.removeEventListener('parsing-failed', parsingFailed)
        reject(e)
      }

      if (editor.isParsing) {
        editor.addEventListener('quads-changed', parsingComplete)
        editor.addEventListener('parsing-failed', parsingFailed)
      } else {
        resolve()
      }
    })
  }
}
