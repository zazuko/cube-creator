import { GraphPointer } from 'clownface'
import { csvw, schema, rdf, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { NotFoundError } from '../../errors'

const trueTerm = $rdf.literal('true', xsd.boolean)

interface CreateTableCommand {
  tableCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store?: ResourceStore
}

export async function createTable({
  tableCollection,
  resource,
  store = resourceStore(),
}: CreateTableCommand): Promise<GraphPointer> {
  const label = resource.out(schema.name)
  if (!label?.term) {
    throw new Error('schema:name missing from the payload')
  }

  const csvMapping = tableCollection.out(cc.csvMapping)
  if (!csvMapping?.term) {
    throw new Error('cc:csvMapping missing from the payload')
  }

  const table = await store
    .createMember(tableCollection.term, id.table(csvMapping.term, label.term.value))

  const csvSourceId = resource.out(cc.csvSource).term! as NamedNode
  const csvSource = await store.get(csvSourceId)
  if (!csvSource) {
    throw new NotFoundError(csvSourceId)
  }

  table.addOut(rdf.type, cc.Table)
  table.addOut(cc.csvSource, csvSourceId)
  table.addOut(cc.csvMapping, csvMapping.term)
  table.addOut(schema.name, label)
  table.addOut(cc.identifierTemplate, resource.out(cc.identifierTemplate))
  table.addOut(schema.color, resource.out(schema.color))

  if (trueTerm.equals(resource.out(cc.isObservationTable).term)) {
    table.addOut(rdf.type, cc.ObservationTable)
  }

  // Create default column mappings for provided columns
  resource.out(csvw.column)
    .forEach(({ term: columnId }) => {
      const column = csvSource.out(csvw.column).toArray()
        .find(({ term }) => term.equals(columnId))

      if (!column) {
        throw new Error(`Column ${columnId} not found`)
      }

      const columnMapping = createColumnMapping({ table, column, store })
      table.addOut(cc.columnMapping, columnMapping)
    })

  await store.save()
  return table
}

interface CreateColumnMappingCommand {
  table: GraphPointer<NamedNode>
  column: GraphPointer
  store?: ResourceStore
}

function createColumnMapping({
  table,
  column,
  store = resourceStore(),
}: CreateColumnMappingCommand): GraphPointer {
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
  return $rdf.namedNode(columnName)
}
