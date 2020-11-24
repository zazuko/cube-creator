import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import { ColumnMapping, CsvMapping, DimensionMetadataCollection, Table } from '@cube-creator/model'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import * as TableQueries from '../queries/table'
import { NotFoundError } from '../../errors'

interface DeleteColumnMappingCommand {
  resource: NamedNode
  store?: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
  tableQueries?: Pick<typeof TableQueries, 'getTableForColumnMapping'>
}

export async function deleteColumnMapping({
  resource,
  store = resourceStore(),

  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
  tableQueries: { getTableForColumnMapping } = TableQueries,
}: DeleteColumnMappingCommand): Promise<void> {
  const columnMapping = await store.getResource<ColumnMapping>(resource)

  if (!columnMapping || columnMapping.id.termType !== 'NamedNode') {
    throw new NotFoundError(resource)
  }

  const tableId = await getTableForColumnMapping(columnMapping.id)
  const table = await store.getResource<Table>(tableId)

  if (!table) {
    throw new NotFoundError(tableId)
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

    const dimension = dimensionMetaDataCollection.findDimension({ csvMapping, targetProperty: columnMapping.targetProperty })
    if (dimension && dimension.id.termType === 'NamedNode') {
      store.delete(dimension.id)
    }
  }

  // Delete Graph
  store.delete(resource)
}
