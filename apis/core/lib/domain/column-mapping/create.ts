import { GraphPointer } from 'clownface'
import { rdf, schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'

interface CreateColumnMappingCommand {
  table: GraphPointer<NamedNode>
  resource: GraphPointer
  store?: ResourceStore
}

interface CreateColumnMappingFromColumnCommand {
  table: GraphPointer<NamedNode>
  column: GraphPointer
  store?: ResourceStore
}

export async function createColumnMapping({
  table,
  resource,
  store = resourceStore(),
}: CreateColumnMappingCommand): Promise<GraphPointer> {
  const columnId = resource.out(cc.sourceColumn).term as NamedNode
  const column = await store.get(columnId)
  const columnName = column.out(schema.name).value!
  const columnMapping = store.create(id.columnMapping(table, columnName))

  columnMapping
    .addOut(rdf.type, cc.ColumnMapping)
    .addOut(cc.sourceColumn, columnId)
    .addOut(cc.targetProperty, resource.out(cc.targetProperty).term!)

  store.save()

  return columnMapping
}

export function createColumnMappingFromColumn({
  table,
  column,
  store = resourceStore(),
}: CreateColumnMappingFromColumnCommand): GraphPointer {
  const columnName = column.out(schema.name).value!

  const columnMapping = store.create(id.columnMapping(table, columnName))

  columnMapping
    .addOut(rdf.type, cc.ColumnMapping)
    .addOut(cc.sourceColumn, column)
    .addOut(cc.targetProperty, defaultProperty(columnName))

  return columnMapping
}

function defaultProperty(columnName: string) {
  // TODO: How do we define the default target property for a column?
  return $rdf.literal(columnName)
}
