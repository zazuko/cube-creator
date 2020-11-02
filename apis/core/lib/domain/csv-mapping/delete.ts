
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'

import { deleteSourceWithoutSave } from '../csv-source/delete'
import { cc } from '@cube-creator/core/namespace'

export async function deleteMapping(csvMapping: NamedNode, store: ResourceStore): Promise<void> {
  const csvMappingResource = await store.get(csvMapping)
  if (!csvMappingResource) return

  const sources = csvMappingResource.out(cc.csvSource).terms
  for await (const source of sources) {
    if (source.termType === 'NamedNode') {
      await deleteSourceWithoutSave(source, store)
    }
  }

  const sourceCollection = csvMappingResource.out(cc.csvSourceCollection).term
  if (sourceCollection?.termType === 'NamedNode') {
    store.delete(sourceCollection)
  }

  const tableCollection = csvMappingResource.out(cc.tables).term
  if (tableCollection?.termType === 'NamedNode') {
    store.delete(tableCollection)
  }

  store.delete(csvMapping)
}
