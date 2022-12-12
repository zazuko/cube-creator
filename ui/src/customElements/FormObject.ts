import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js'

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
    `
  }

  @property({ type: Boolean })
  canRemove = false

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
      </div>`
  }

  onRemove () {
    this.dispatchEvent(new Event('remove'))
  }
}
