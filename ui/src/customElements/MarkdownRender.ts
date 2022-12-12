import MarkdownIt from 'markdown-it'
import { html, LitElement, PropertyValues } from 'lit'
import { unsafeHTML } from 'lit/directives/unsafe-html.js'
import { customElement, property } from 'lit/decorators.js'

@customElement('markdown-render')
export class MarkdownRender extends LitElement {
  @property({ type: String })
  source!: string

  @property({ type: Object })
  anchorAttributes: Record<string, string> = {}

  @property({ type: String })
  rendered = ''

  md = new MarkdownIt()

  protected updated (_changedProperties: PropertyValues) {
    if (_changedProperties.has('anchorAttributes')) {
      const defaultLinkRenderer = this.md.renderer.rules.link_open ||
        function (tokens, idx, options, env, self) {
          return self.renderToken(tokens, idx, options)
        }

      this.md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        Object.keys(this.anchorAttributes).forEach((attribute) => {
          const aIndex = tokens[idx].attrIndex(attribute)
          const value = this.anchorAttributes[attribute]
          const token = tokens[idx]

          if (aIndex < 0) {
            token.attrPush([attribute, value]) // add new attribute
          } else {
            if (token.attrs) {
              token.attrs[aIndex][1] = value
            }
          }
        })
        return defaultLinkRenderer(tokens, idx, options, env, self)
      }
    }
    if (_changedProperties.has('source')) {
      this.rendered = this.source ? this.md.render(this.source) : ''
    }
  }

  protected createRenderRoot (): Element | ShadowRoot {
    return this
  }

  protected render (): unknown {
    return html`${unsafeHTML(this.rendered)}`
  }
}
