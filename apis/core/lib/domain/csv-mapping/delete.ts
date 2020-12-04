import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { deleteSourceWithoutSave } from '../csv-source/delete'
import { cc } from '@cube-creator/core/namespace'
import { deleteTableWithoutSave } from '../table/delete'
import { getTablesForMapping } from '../queries/table'

export async function deleteMapping(csvMapping: NamedNode, store: ResourceStore): Promise<void> {
  const csvMappingResource = await store.get(csvMapping, { allowMissing: true })
  if (!csvMappingResource) return

  const sources = csvMappingResource.out(cc.csvSource).terms
  for await (const source of sources) {
    await deleteSourceWithoutSave({ resource: source, store })
  }

  const sourceCollection = csvMappingResource.out(cc.csvSourceCollection).term
  if (sourceCollection?.termType === 'NamedNode') {
    store.delete(sourceCollection)
  }

  const tables = getTablesForMapping(csvMapping)
  for await (const table of tables) {
    await deleteTableWithoutSave(table, store)
  }

  const tableCollection = csvMappingResource.out(cc.tables).term
  if (tableCollection?.termType === 'NamedNode') {
    store.delete(tableCollection)
  }

  store.delete(csvMapping)
}
