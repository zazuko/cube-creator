import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import { ColumnMapping, CsvMapping, DimensionMetadataCollection, Table } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import * as TableQueries from '../queries/table'

interface DeleteColumnMappingCommand {
  resource: NamedNode
  store: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
  tableQueries?: Pick<typeof TableQueries, 'getTableForColumnMapping'>
}

export async function deleteColumnMapping({
  resource,
  store,
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
  tableQueries: { getTableForColumnMapping } = TableQueries,
}: DeleteColumnMappingCommand): Promise<void> {
  const columnMapping = await store.getResource<ColumnMapping>(resource)

  const tableId = await getTableForColumnMapping(columnMapping.id as NamedNode)
  const table = await store.getResource<Table>(tableId)

  table.pointer.dataset.delete($rdf.quad(table.pointer.term, cc.columnMapping, columnMapping.id))

  if (table.isObservationTable) {
    const csvMapping = await store.getResource<CsvMapping>(table.csvMapping.id)
    const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
    const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)

    const dimension = dimensionMetaDataCollection.find({ csvMapping, targetProperty: columnMapping.targetProperty })
    if (dimension && dimension.id.termType === 'NamedNode') {
      dimensionMetaDataCollection.deleteDimension(dimension)
    }
  }

  // Delete Graph
  store.delete(resource)
}
