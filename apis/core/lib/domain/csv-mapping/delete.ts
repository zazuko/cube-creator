
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { getSourcesFromMapping } from '../queries/csv-source'

import { deleteSourceWithoutSave } from '../csv-source/delete'
import { cc } from '@cube-creator/core/namespace'

export async function deleteMapping(csvMapping: NamedNode, store: ResourceStore): Promise<void> {
  const sources = await getSourcesFromMapping(csvMapping)
  for (const source of sources) {
    await deleteSourceWithoutSave(source, store)
  }

  const graph = await store.get(csvMapping)
  const collection = graph.out(cc.csvSourceCollection).term
  if (collection?.termType === 'NamedNode') {
    store.delete(collection)
  }

  store.delete(csvMapping)
}
