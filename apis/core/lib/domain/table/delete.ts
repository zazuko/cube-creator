import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { cc } from '@cube-creator/core/namespace'

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
    await deleteColumnMapping(columnMapping, store)
  }

  // Delete Graph
  store.delete(tableTerm)
}

async function deleteColumnMapping(columnMapping: Term, store: ResourceStore) {
  if (columnMapping?.termType === 'NamedNode') {
    await store.delete(columnMapping)
  }
}
