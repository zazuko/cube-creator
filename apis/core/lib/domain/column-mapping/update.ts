import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import { ColumnMapping, CsvColumn, CsvMapping, CsvSource, DimensionMetadataCollection, Table } from '@cube-creator/model'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import * as TableQueries from '../queries/table'
import { findMapping } from './lib'
import { NotFoundError, DomainError } from '../../errors'

interface UpdateColumnMappingCommand {
  resource: GraphPointer
  store?: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
  tableQueries?: Pick<typeof TableQueries, 'getTableForColumnMapping'>
}

export async function updateColumnMapping({
  resource,
  store = resourceStore(),
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
  tableQueries: { getTableForColumnMapping } = TableQueries,
}: UpdateColumnMappingCommand): Promise<GraphPointer> {
  const columnMapping = await store.getResource<ColumnMapping>(resource.term)

  if (!columnMapping || columnMapping.id.termType !== 'NamedNode') {
    throw new NotFoundError(resource.term)
  }

  const tableId = await getTableForColumnMapping(columnMapping.id)
  const table = await store.getResource<Table>(tableId)

  if (!table) {
    throw new NotFoundError(tableId)
  }

  const targetProperty = resource.out(cc.targetProperty).term!

  const columnId = resource.out(cc.sourceColumn).term as NamedNode
  if (columnId.value !== columnMapping.sourceColumn.id.value) {
    const source = await store.getResource<CsvSource>(table.csvSource?.id)
    const column = source?.columns.find(({ id }) => id.equals(columnId))

    if (!column) {
      throw new NotFoundError(columnId)
    }

    columnMapping.sourceColumn = column
  }

  if (targetProperty.value !== columnMapping.targetProperty.value) {
    if (table.isObservationTable) {
      const mappingExists = await findMapping(table, targetProperty, store)
      if (mappingExists) {
        const column = await store.getResource<CsvColumn>(mappingExists.sourceColumn?.id)
        throw new DomainError(`Target property already mapped from column ${column?.name}`)
      }
    }

    if (table.types.has(cc.ObservationTable)) {
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

  columnMapping.datatype = resource.out(cc.datatype).term as NamedNode
  columnMapping.language = resource.out(cc.language).value
  columnMapping.defaultValue = resource.out(cc.defaultValue).term

  store.save()
  return columnMapping.pointer
}
