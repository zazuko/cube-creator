import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import { CsvColumn, CsvSource, Table } from '@cube-creator/model'
import { findMapping } from './lib'
import { DomainError } from '../../errors'

interface CreateColumnMappingCommand {
  tableId: NamedNode
  resource: GraphPointer
  store?: ResourceStore
}

export async function createColumnMapping({
  tableId,
  resource,
  store = resourceStore(),
}: CreateColumnMappingCommand): Promise<GraphPointer> {
  const table = await store.getResource<Table>(tableId)

  if (!table) {
    throw new Error(`Table ${tableId.value} not found`)
  }

  const columnId = resource.out(cc.sourceColumn).term as NamedNode
  const source = await store.getResource<CsvSource>(table.csvSource?.id)
  const column = source?.columns.find(({ id }) => id.equals(columnId))

  if (!column) {
    throw new Error(`Column ${columnId.value} not found`)
  }

  const targetProperty = resource.out(cc.targetProperty).term!
  const mappingExists = await findMapping(table, targetProperty, store)
  if (mappingExists) {
    const column = await store.getResource<CsvColumn>(mappingExists.sourceColumn?.id)
    throw new DomainError(`Target property already mapped from column ${column?.name}`)
  }

  const columnMapping = table.addColumnMapping({
    store,
    sourceColumn: column,
    targetProperty,
    datatype: resource.out(cc.datatype).term as NamedNode,
    language: resource.out(cc.language).value,
    defaultValue: resource.out(cc.defaultValue).term,
  })

  store.save()

  return columnMapping.pointer
}
