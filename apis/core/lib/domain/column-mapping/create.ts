import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import * as ColumnMapping from '@cube-creator/model/ColumnMapping'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import { CsvColumn, Table } from '@cube-creator/model'

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
  const column = await store.getResource<CsvColumn>(columnId)

  if (!column) {
    throw new Error(`Column ${columnId} not found`)
  }

  const columnMapping = ColumnMapping.create(store.create(id.columnMapping(table, column.name)), {
    sourceColumn: column,
    targetProperty: resource.out(cc.targetProperty).term!,
  })

  store.save()

  return columnMapping.pointer
}
