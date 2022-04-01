import { InstancesSelectEditor } from '@hydrofoil/shaperone-core/components'
import { dcterms, foaf, rdfs, sd } from '@tpluscode/rdf-ns-builders/strict'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'
import StreamClient from 'sparql-http-client'
import { Lazy, SingleEditorRenderParams } from '@hydrofoil/shaperone-core/models/components/index'

interface InstancesSelectEditorEx extends InstancesSelectEditor {
  _init?(context: SingleEditorRenderParams): void
}

export function loader (createQuery: (arg: GraphPointer) => string, editor: Lazy<InstancesSelectEditor>): Lazy<InstancesSelectEditorEx> {
  return {
    ...editor,
    init (context, actions) {
      if (!context.value.componentState.client) {
        const source = context.property.shape.get(dcterms.source)

        const endpointUrl = source?.get(sd.endpoint).id.value
        const queryUi = source?.getString(foaf.page)

        let client: StreamClient | undefined
        if (endpointUrl) {
          client = new StreamClient({
            endpointUrl
          })
        }

        context.updateComponentState({ client, queryUi })
      }

      this._init?.(context)

      return editor.init?.call(this, context, actions) || true
    },
    shouldLoad ({ focusNode, value: { componentState } }) {
      // run query only when it's different from previous
      const query = createQuery(focusNode)
      return !!query && query !== componentState.query
    },
    async loadChoices ({ value, focusNode, updateComponentState }) {
      const client = value.componentState.client
      if (!client) {
        return []
      }

      // build query based on current hierarchy selection
      const query = createQuery(focusNode)
      // memoize the query
      updateComponentState({ query })

      const stream = await client.query.construct(query)

      const dataset = await $rdf.dataset().import(stream)

      // find in results resources with labels. these are the properties
      return clownface({ dataset }).has(rdfs.label).toArray()
    }
  }
}
