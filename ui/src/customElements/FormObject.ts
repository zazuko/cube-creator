import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
import { ValidationResultState } from '@hydrofoil/shaperone-core/models/forms/index'

@customElement('form-object')
export class FormObject extends LitElement {
  static get styles () {
    return css`
      #wrapper {
        display: flex;
        justify-content: space-between;
      }

      #editor {
        flex: 1
      }

      #button {
        font-size: 2em;
        max-width: 95%;
      }

      .errors {
        list-style: none;
        padding: 0;
        color: red;
      }
    `
  }

  @property({ type: Boolean })
  canRemove = false

  @property({ type: Object })
  violations: Array<ValidationResultState> = []

  render () {
    let remove = html``
    if (this.canRemove) {
      remove = html`<sl-icon-button name="dash" @click="${this.onRemove}"></sl-icon-button>`
    }

    return html`
      <div id="wrapper">
        <div id="editor">
          <slot></slot>
        </div>
        <div id="button">
          ${remove}
        </div>
      </div>
      ${this.renderErrors()}`
  }

  private renderErrors () {
    let summary = html``
    if (this.violations.length) {
      summary = html`<ul class="errors">
        ${this.violations.map(({ result }) => html`<li>${result.resultMessage}</li>`)}
      </ul>`
    }

    return summary
  }

  onRemove () {
    this.dispatchEvent(new Event('remove'))
  }
}
