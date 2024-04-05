import type { Term } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import type { Plugin } from '@captaincodeman/rdx/typings/modelStore'
import { api } from '@/api/index'
import $rdf from '@zazuko/env'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { meta } from '@cube-creator/core/namespace'
import { SetObjectParams } from '@hydrofoil/shaperone-core/models/forms/reducers/updateObject'
import { PropertyState } from '@hydrofoil/shaperone-core/models/forms'

function copyGraph (from: GraphPointer, to: GraphPointer) {
  const quads = from.dataset.match(null, null, null, from.term)

  function replace (term: Term) {
    return term.equals(from.term) ? to.term : term
  }

  for (const { subject, predicate, object } of quads) {
    to.node(replace(subject)).addOut(predicate, replace(object))
  }
}

/**
 * Listens to changes to `meta:inHierarchy/schema:isBasedOn` property. When it does,
 * dereferences that resource and replaces the value of `meta:inHierarchy` itself
 */
export const dimensionMetaHierarchySynchronizer: Plugin = {
  model: {
    state: null,
    reducers: {},
    effects (store) {
      const dispatch = store.getDispatch()

      return {
        'forms/setObjectValue': async ({ property, newValue, form, focusNode }: SetObjectParams) => {
          if (Array.isArray(property.path)) {
            return
          }

          if (!property.path?.equals(schema.isBasedOn)) {
            return
          }

          const hierarchyId = 'termType' in newValue ? newValue : newValue.term
          const hierarchyCopy = await loadHierarchy(hierarchyId)

          const inHierarchySubject = focusNode.in(meta.inHierarchy)
          const inHierarchyProperty: PropertyState = store.getState().forms.get(form)
            .focusNodes[inHierarchySubject.value!]
            ?.properties.find((p: PropertyState) => {
              return p.shape.path && 'equals' in p.shape.path && p.shape.path.equals(meta.inHierarchy)
            })

          const [inHierarchyObject] = inHierarchyProperty?.objects || []

          if (!inHierarchyObject) {
            return
          }

          dispatch.forms.setObjectValue({
            form,
            newValue: hierarchyCopy,
            property: inHierarchyProperty.shape,
            object: inHierarchyObject,
            focusNode: inHierarchySubject,
          })
        }
      }
    },
  }
}

async function loadHierarchy (term: Term) {
  const hierarchy = await api.fetchResource(term.value)
  const copy = $rdf.clownface()
    .blankNode()
    .addOut(schema.isBasedOn, term)
    .addOut(rdf.type, meta.Hierarchy)

  copyGraph(hierarchy.pointer, copy)

  copy.deleteOut(rdf.type).addOut(rdf.type, meta.Hierarchy)
  return copy
}
