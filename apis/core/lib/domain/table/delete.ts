import { NamedNode, Term } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { cc } from '@cube-creator/core/namespace'

interface DeleteTableCommand {
  resource: NamedNode
  store?: ResourceStore
}

export async function deleteTable({
  resource,
  store = resourceStore(),
}: DeleteTableCommand): Promise<void> {
  await deleteTableWithoutSave(resource, store)

  // Save changes
  await store.save()
}

export async function deleteTableWithoutSave(tableTerm: Term, store: ResourceStore): Promise<void> {
  if (tableTerm.termType !== 'NamedNode') return

  const table = await store.get(tableTerm)
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
