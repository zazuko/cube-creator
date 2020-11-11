import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import { CsvSource, Table } from '@cube-creator/model'

interface CreateColumnMappingCommand {
  table: Table
  resource: GraphPointer
  store?: ResourceStore
}

export async function createColumnMapping({
  table,
  resource,
  store = resourceStore(),
}: CreateColumnMappingCommand): Promise<GraphPointer> {
  const columnId = resource.out(cc.sourceColumn).term as NamedNode
  const source = await store.getResource<CsvSource>(table.csvSource.id)
  const column = source?.columns.find(({ id }) => id.equals(columnId))

  if (!column) {
    throw new Error(`Column ${columnId} not found`)
  }

  const columnMapping = table.addColumnMapping({
    store,
    sourceColumn: column,
    targetProperty: resource.out(cc.targetProperty).term!,
    datatype: resource.out(cc.datatype).term as NamedNode,
    language: resource.out(cc.language).value,
    defaultValue: resource.out(cc.defaultValue).term,
  })

  store.save()

  return columnMapping.pointer
}
