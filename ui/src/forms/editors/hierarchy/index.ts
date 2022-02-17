import { InstancesSelectEditor } from '@hydrofoil/shaperone-core/components'
import { dcterms, rdfs, sd } from '@tpluscode/rdf-ns-builders/strict'
import StreamClient from 'sparql-http-client'
import $rdf from 'rdf-ext'
import clownface, { GraphPointer } from 'clownface'

export function loader (createQuery: (arg: GraphPointer) => string): Pick<InstancesSelectEditor, 'shouldLoad' | 'loadChoices'> {
  return {
    shouldLoad ({ focusNode, value: { componentState } }) {
      // run query only when it's different from previous
      const query = createQuery(focusNode)
      return !!query && query !== componentState.query
    },
    async loadChoices ({ property, focusNode, updateComponentState }) {
      const endpointUrl = property.shape.get(dcterms.source)?.get(sd.endpoint).id.value
      if (!endpointUrl) {
        return []
      }

      const client = new StreamClient({
        endpointUrl
      })

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
