import { InstancesSelectEditor } from '@hydrofoil/shaperone-core/components'
import { rdfs } from '@tpluscode/rdf-ns-builders/strict'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'

export function loader (createQuery: (arg: GraphPointer) => string): Pick<InstancesSelectEditor, 'shouldLoad' | 'loadChoices'> {
  return {
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
