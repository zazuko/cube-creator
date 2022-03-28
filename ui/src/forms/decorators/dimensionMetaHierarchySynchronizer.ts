import { DetailsEditor } from '@hydrofoil/shaperone-core/components'
import { Term } from 'rdf-js'
import clownface, { GraphPointer } from 'clownface'
import { ComponentDecorator } from '@hydrofoil/shaperone-core/models/components/index'
import { dash, sh } from '@tpluscode/rdf-ns-builders'
import { api } from '@/api/index'
import $rdf from 'rdf-ext'
import { rdf, schema } from '@tpluscode/rdf-ns-builders/strict'
import { meta } from '@cube-creator/core/namespace'

interface DetailsEditorEx extends DetailsEditor {
  shouldLoad(a: any): boolean
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
 * Decorates `dash:DetailsEditor` so that whenever a `meta:hasHierarchy/schema:isBasedOn` value changes
 * that resource will be dereferenced and replaced as the value of `meta:hasHierarchy` itself
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

        return copy
      },
      shouldLoad ({ property, value }) {
        if (property.shape.pointer.has(sh.path, meta.hasHierarchy).terms.length) {
          const previouslySelected: Term | undefined = value.componentState.hierarchyId
          const hierarchy = value.object?.out(schema.isBasedOn).term

          return hierarchy && !hierarchy.equals(previouslySelected)
        }

        return false
      },
      init (params) {
        const { value, updateComponentState } = params

        if (this.shouldLoad(params) && !value.componentState.loading) {
          updateComponentState({
            loading: true,
          });
          (async () => {
            const hierarchyId = value.object?.out(schema.isBasedOn).term
            if (hierarchyId) {
              updateComponentState({
                hierarchyId,
                hierarchy: await this.loadHierarchy(hierarchyId),
                ready: true,
                loading: false,
              })
            }
          })()

          return false
        }
        return !value.componentState.loading
      },
      _decorateRender (render) {
        return function ({ property, value, updateComponentState, ...context }, { update, ...rest }) {
          const currentBase = value.object?.out(schema.isBasedOn).term
          const { previousBase } = value.componentState
          if (currentBase && !currentBase?.equals(previousBase)) {
            updateComponentState({
              previousBase: currentBase
            })
            update(value.componentState.hierarchy)
          }

          return render({ property, value, updateComponentState, ...context }, { update, ...rest })
        }
      }
    }
  }
}
