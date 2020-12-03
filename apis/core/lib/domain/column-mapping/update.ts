import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import {
  ColumnMapping,
  CsvMapping,
  CsvSource,
  DimensionMetadataCollection,
  LiteralColumnMapping,
  ReferenceColumnMapping,
  Table,
} from '@cube-creator/model'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import * as TableQueries from '../queries/table'
import { findMapping } from './lib'
import { NotFoundError, DomainError } from '../../errors'
import * as id from '../identifiers'
import { createIdentifierMapping } from '@cube-creator/model/ColumnMapping'

interface UpdateColumnMappingCommand {
  resource: GraphPointer
  store?: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
  tableQueries?: Pick<typeof TableQueries, 'getTableForColumnMapping'>
}

export async function updateLiteralColumnMapping({
  resource,
  store = resourceStore(),
  dimensionMetadataQueries = DimensionMetadataQueries,
  tableQueries = TableQueries,
}: UpdateColumnMappingCommand): Promise<GraphPointer> {
  const { columnMapping, table } = await updateColumnMapping<LiteralColumnMapping>({
    resource,
    store,
    dimensionMetadataQueries,
    tableQueries,
  })

  const columnId = resource.out(cc.sourceColumn).term!
  if (columnId.value !== columnMapping.sourceColumn?.id.value) {
    const source = await store.getResource<CsvSource>(table.csvSource?.id)
    const column = source?.columns.find(({ id }) => id.equals(columnId))

    if (!column) {
      throw new NotFoundError(columnId)
    }

    columnMapping.sourceColumn = column
  }

  columnMapping.datatype = resource.out(cc.datatype).term as NamedNode
  columnMapping.language = resource.out(cc.language).value
  columnMapping.defaultValue = resource.out(cc.defaultValue).term

  store.save()
  return columnMapping.pointer
}

export async function updateReferenceColumnMapping({
  resource,
  store = resourceStore(),
  dimensionMetadataQueries = DimensionMetadataQueries,
  tableQueries = TableQueries,
}: UpdateColumnMappingCommand): Promise<GraphPointer> {
  const { columnMapping, table } = await updateColumnMapping<ReferenceColumnMapping>({
    resource,
    store,
    dimensionMetadataQueries,
    tableQueries,
  })

  // Update referencedTable
  const referencedTableId = resource.out(cc.referencedTable).term!
  const referencedTable = await store.getResource<Table>(referencedTableId)
  if (!referencedTable) throw new NotFoundError(referencedTableId)
  columnMapping.referencedTable = referencedTable

  // Update identifierMapping
  columnMapping.pointer.out(cc.identifierMapping).deleteOut()
  columnMapping.identifierMapping = await Promise.all(resource.out(cc.identifierMapping)
    .map(async (identifierMapping) => {
      const source = await store.getResource<CsvSource>(table.csvSource?.id)
      const sourceColumnId = identifierMapping.out(cc.sourceColumn).term!
      const sourceColumn = source?.columns.find(({ id }) => id.equals(sourceColumnId))
      if (!sourceColumn) throw new NotFoundError(sourceColumnId)

      const referencedSource = await store.getResource<CsvSource>(referencedTable.csvSource?.id)
      const referencedColumnId = identifierMapping.out(cc.referencedColumn).term!
      const referencedColumn = referencedSource?.columns.find(({ id }) => id.equals(referencedColumnId))
      if (!referencedColumn) throw new NotFoundError(referencedColumnId)

      return createIdentifierMapping(
        columnMapping.pointer.node(id.identifierMapping(columnMapping)),
        { sourceColumn, referencedColumn },
      )
    }))

  store.save()
  return columnMapping.pointer
}

async function updateColumnMapping<T extends ColumnMapping>({
  resource,
  store = resourceStore(),
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
  tableQueries: { getTableForColumnMapping } = TableQueries,
}: UpdateColumnMappingCommand): Promise<{ columnMapping: T; table: Table }> {
  const columnMapping = await store.getResource<T>(resource.term)

  if (!columnMapping || columnMapping.id.termType !== 'NamedNode') {
    throw new NotFoundError(resource.term)
  }

  const tableId = await getTableForColumnMapping(columnMapping.id)
  const table = await store.getResource<Table>(tableId)

  if (!table) {
    throw new NotFoundError(tableId)
  }

  const targetProperty = resource.out(cc.targetProperty).term!

  if (targetProperty.value !== columnMapping.targetProperty.value) {
    if (table.isObservationTable) {
      const mappingExists = await findMapping(table, targetProperty, store)
      if (mappingExists) {
        throw new DomainError('Target property already mapped')
      }

      const csvMapping = await store.getResource<CsvMapping>(table.csvMapping.id)
      if (!csvMapping) {
        throw new NotFoundError(csvMapping)
      }
      const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
      const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)
      if (!dimensionMetaDataCollection) {
        throw new NotFoundError(dimensionMetaDataCollectionPointer)
      }

      const dimension = dimensionMetaDataCollection.find({ csvMapping, targetProperty: columnMapping.targetProperty })
      if (!dimension) {
        throw new NotFoundError(dimension)
      }
      dimension.about = csvMapping.createIdentifier(targetProperty)
    }

    columnMapping.targetProperty = targetProperty
  }

  return { columnMapping, table }
}
