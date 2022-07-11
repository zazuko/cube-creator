import { DetailsEditor } from '@hydrofoil/shaperone-core/components'
import { Term } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { ComponentDecorator } from '@hydrofoil/shaperone-core/models/components/index'
import { dash } from '@tpluscode/rdf-ns-builders'
import { api } from '@/api/index'
import $rdf from 'rdf-ext'
import { rdf, schema } from '@tpluscode/rdf-ns-builders/strict'
import { meta } from '@cube-creator/core/namespace'

interface DetailsEditorEx extends DetailsEditor {
  loadHierarchy(arg: Term): Promise<GraphPointer>
}

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
 * Decorates `dash:DetailsEditor` so that whenever a `meta:inHierarchy/schema:isBasedOn` value changes
 * that resource will be dereferenced and replaced as the value of `meta:inHierarchy` itself
 */
export const dimensionMetaHierarchySynchronizer: ComponentDecorator<DetailsEditorEx> = {
  applicableTo (component) {
    return component.editor.equals(dash.DetailsEditor)
  },
  decorate (component) {
    return {
      ...component,
      async loadHierarchy (term: Term) {
        const hierarchy = await api.fetchResource(term.value)
        const copy = clownface({ dataset: $rdf.dataset() })
          .blankNode()
          .addOut(schema.isBasedOn, term)
          .addOut(rdf.type, meta.Hierarchy)

        copyGraph(hierarchy.pointer, copy)

        copy.deleteOut(rdf.type).addOut(rdf.type, meta.Hierarchy)
        return copy
      },
      init (params, { update }) {
        const { value, updateComponentState } = params

        const hierarchyId = value.object?.out(schema.isBasedOn).term
        if (!value.componentState.ready) {
          updateComponentState({
            hierarchyId,
            ready: true,
          })
          return true
        }

        const hierarchyIdChanged = hierarchyId && !hierarchyId.equals(value.componentState.hierarchyId)
        if (hierarchyIdChanged && !value.componentState.loading) {
          const loading = this.loadHierarchy(hierarchyId)
            .then(hierarchy => {
              update(hierarchy)
              updateComponentState({
                loading: undefined,
              })
            })

          updateComponentState({ hierarchyId, loading })
          return false
        }

        return !value.componentState.loading
      }
    }
  }
}
