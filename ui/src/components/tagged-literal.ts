import { html, LitElement } from 'lit'
import { property, customElement } from 'lit/decorators.js'
import { taggedLiteral, PointerLike } from '@rdfjs-elements/lit-helpers/taggedLiteral.js'
import { NamedNode } from 'rdf-js'
import { namedNode } from '@rdfjs/dataset'
import { schema } from '@tpluscode/rdf-ns-builders/strict'

@customElement('tagged-literal')
export class TaggedLiteral extends LitElement {
  @property({ type: Object })
  resource?: PointerLike

  @property({
    type: Object,
    converter (value) {
      return value ? namedNode(value) : undefined
    }
  })
  property?: NamedNode = schema.name

  protected render () {
    return html`${taggedLiteral(this.resource, { property: this.property })}`
  }

  protected createRenderRoot () {
    return this
  }
}
