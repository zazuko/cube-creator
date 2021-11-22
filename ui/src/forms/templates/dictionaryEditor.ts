import { html } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { decorate, FocusNodeTemplate, PropertyTemplate } from '@hydrofoil/shaperone-wc/templates'
import { prov, rdf } from '@tpluscode/rdf-ns-builders'

export const focusNode = decorate((wrapped: FocusNodeTemplate): FocusNodeTemplate => {
  return (renderer, { focusNode }) => {
    if (focusNode.focusNode.has(rdf.type, prov.KeyEntityPair).terms.length) {
      return html`${repeat(focusNode.groups, group => renderer.renderGroup({ group }))}`
    }

    return wrapped(renderer, { focusNode })
  }
})

export const property = decorate((wrapped: PropertyTemplate): PropertyTemplate => {
  return (renderer, { property }) => {
    if (renderer.focusNode.focusNode.has(rdf.type, prov.KeyEntityPair).terms.length) {
      return html`${repeat(property.objects, object => renderer.renderObject({ object }))}`
    }

    return wrapped(renderer, { property })
  }
})
