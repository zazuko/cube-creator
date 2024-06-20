import type { NamedNode } from '@rdfjs/types'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore.js'
import { deleteColumnMapping } from '../column-mapping/delete.js'
import { getReferencingMappingsForTable } from '../queries/column-mapping.js'

interface DeleteTableCommand {
  resource: NamedNode
  store: ResourceStore
}

export async function deleteTable({
  resource: tableTerm,
  store,
}: DeleteTableCommand): Promise<void> {
  if (tableTerm.termType !== 'NamedNode') return

  const table = await store.get(tableTerm, { allowMissing: true })
  if (!table) return

  // Delete in columnMappings
  const columnMappings = table.out(cc.columnMapping).terms
  for await (const columnMapping of columnMappings) {
    if (columnMapping.termType === 'NamedNode') {
      await deleteColumnMapping({
        resource: columnMapping,
        store,
      })
    }
  }

  // Remove mappings from linked tables
  const referencingColumnMappings = getReferencingMappingsForTable(tableTerm)
  for await (const columnMapping of referencingColumnMappings) {
    if (columnMapping.termType === 'NamedNode') {
      await deleteColumnMapping({
        resource: columnMapping,
        store,
      })
    }
  }

  // Delete Graph
  store.delete(tableTerm)
}
