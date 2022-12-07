import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'
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
    `
  }

  @property({ type: Boolean })
  canAdd = false

  @property({ type: String })
  name?: string

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
      <label class="form-property">
        <slot name="label"></slot>
        <slot name="help-text"></slot>
        <slot></slot>
        <div id="button">
          ${addButton}
        </div>
      </label>
    `
  }

  private onAdd () {
    this.dispatchEvent(new Event('add'))
  }
}
