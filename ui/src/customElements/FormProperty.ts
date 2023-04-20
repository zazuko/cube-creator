import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
import { ValidationResultState } from '@hydrofoil/shaperone-core/models/forms/index'
import './MarkdownRender'

@customElement('form-property')
export class FormProperty extends LitElement {
  static get styles () {
    return css`
      .form-property {
        display: block;
        padding: var(--cc-property-object-padding);
      }

      #button {
        font-size: 2em;
      }

      slot[name=help-text]::slotted(*) {
        margin-bottom: 0.75rem;
      }

      [has-violations] {
        border: 1px solid red;
        padding: 4px;
        margin: -5px;
      }

      [has-violations] slot[name=label]::slotted(*) {
        color: red !important;
      }

      .errors {
        list-style: none;
        padding: 0;
        color: red;
      }
    `
  }

  @property({ type: Boolean })
  canAdd = false

  @property({ type: String })
  name?: string

  @property({ type: Object })
  violations: Array<ValidationResultState> = []

  get hasViolations () {
    return this.violations.length > 0
  }

  get linkAttrs () {
    return {
      target: '_blank',
      rel: 'noopener noreferrer nofollow',
    }
  }

  protected render (): unknown {
    let addButton = html``
    if (this.canAdd) {
      addButton = html`<sl-icon-button name="plus" @click="${this.onAdd}"></sl-icon-button>`
    }

    return html`
      <label class="form-property" ?has-violations="${this.hasViolations}">
        <slot name="label"></slot>
        ${this.renderErrors()}
        <slot name="help-text"></slot>
        <slot></slot>
        <div id="button">
          ${addButton}
        </div>
      </label>
    `
  }

  private renderErrors () {
    let summary = html``
    const propertyErrors = this.violations.filter(({ matchedTo }) => matchedTo !== 'object')
    if (propertyErrors.length) {
      summary = html`<ul class="errors">
        ${propertyErrors.map(({ result }) => html`<li>${result.resultMessage}</li>`)}
      </ul>`
    }

    return summary
  }

  private onAdd () {
    this.dispatchEvent(new Event('add'))
  }
}
