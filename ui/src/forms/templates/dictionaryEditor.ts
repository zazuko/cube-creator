import { html } from 'lit-element'
import { repeat } from 'lit-html/directives/repeat'
import { FocusNodeTemplate, PropertyTemplate } from '@hydrofoil/shaperone-wc/templates'
import { prov, rdf } from '@tpluscode/rdf-ns-builders'

export const focusNode = (wrapped: FocusNodeTemplate): FocusNodeTemplate => {
  return (renderer, { focusNode }) => {
    if (focusNode.focusNode.has(rdf.type, prov.KeyEntityPair).terms.length) {
      return html`${repeat(focusNode.groups, group => renderer.renderGroup({ group }))}`
    }

    return wrapped(renderer, { focusNode })
  }
}

export const property = (wrapped: PropertyTemplate): PropertyTemplate => {
  return (renderer, { property }) => {
    if (renderer.focusNode.focusNode.has(rdf.type, prov.KeyEntityPair).terms.length) {
      return html`${repeat(property.objects, object => html`<td>${renderer.renderObject({ object })}</td>`)}`
    }

    return wrapped(renderer, { property })
  }
}
