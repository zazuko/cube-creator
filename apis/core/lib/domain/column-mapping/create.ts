import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NamedNode } from 'rdf-js'
import { CsvColumn, CsvMapping, CsvSource, DimensionMetadataCollection, Table } from '@cube-creator/model'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import { findMapping } from './lib'
import { NotFoundError, DomainError } from '../../errors'

interface CreateColumnMappingCommand {
  tableId: NamedNode
  resource: GraphPointer
  store?: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
}

export async function createColumnMapping({
  tableId,
  resource,
  store = resourceStore(),
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
}: CreateColumnMappingCommand): Promise<GraphPointer> {
  const table = await store.getResource<Table>(tableId)

  if (!table) {
    throw new NotFoundError(tableId)
  }

  const columnId = resource.out(cc.sourceColumn).term as NamedNode
  const source = await store.getResource<CsvSource>(table.csvSource?.id)
  const column = source?.columns.find(({ id }) => id.equals(columnId))

  if (!column) {
    throw new NotFoundError(columnId)
  }

  const targetProperty = resource.out(cc.targetProperty).term!
  if (table.isObservationTable) {
    const mappingExists = await findMapping(table, targetProperty, store)
    if (mappingExists) {
      const column = await store.getResource<CsvColumn>(mappingExists.sourceColumn?.id)
      throw new DomainError(`Target property already mapped from column ${column?.name}`)
    }
  }

  const columnMapping = table.addColumnMapping({
    store,
    sourceColumn: column,
    targetProperty,
    datatype: resource.out(cc.datatype).term as NamedNode,
    language: resource.out(cc.language).value,
    defaultValue: resource.out(cc.defaultValue).term,
  })

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

    dimensionMetaDataCollection.addDimensionMetadata({
      store, columnMapping, csvMapping,
    })
  }

  store.save()

  return columnMapping.pointer
}
