
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { getSourcesFromMapping } from '../queries/csv-source'

import { deleteSourceWithoutSave } from '../csv-source/delete'

export async function deleteMapping(csvMapping: NamedNode, store: ResourceStore): Promise<void> {
  const sources = await getSourcesFromMapping(csvMapping)
  for (const source of sources) {
    await deleteSourceWithoutSave(source, store)
  }
  store.delete(csvMapping)
}
