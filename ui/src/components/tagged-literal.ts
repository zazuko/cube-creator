import { html, LitElement } from 'lit'
import { property, customElement } from 'lit/decorators.js'
import { localizedLabel, PointerLike } from '@rdfjs-elements/lit-helpers/localizedLabel.js'
import type { NamedNode } from '@rdfjs/types'
import rdf from '@cube-creator/env'
import { schema } from '@tpluscode/rdf-ns-builders'

@customElement('tagged-literal')
export class TaggedLiteral extends LitElement {
  @property({ type: Object })
  resource?: PointerLike

  @property({
    type: Object,
    converter (value) {
      return value ? rdf.namedNode(value) : undefined
    }
  })
  property?: NamedNode = schema.name

  protected render () {
    return html`${localizedLabel(this.resource, { property: this.property })}`
  }

  protected createRenderRoot () {
    return this
  }
}
