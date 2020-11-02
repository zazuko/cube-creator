import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { deleteFile } from '../../storage/s3'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'

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

export async function deleteTableWithoutSave(resource: NamedNode<string>, store: ResourceStore): Promise<void> {
  const table = await store.get(resource)
  if (!table) return

  // Delete in columnMappings
  const columnMappings = table.out(cc.columnMapping).terms
  for await (const columnMapping of columnMappings) {
    if (columnMapping?.termType === 'NamedNode') {
      await deleteColumnMapping(columnMapping, store)
    }
  }

  // Delete Graph
  store.delete(resource)
}

async function deleteColumnMapping(columnMapping: NamedNode<string>, store: ResourceStore) {
  await store.delete(columnMapping)
}
