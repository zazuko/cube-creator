import { ColumnMapping, CsvMapping, DimensionMetadataCollection, Table } from '@cube-creator/model'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { GraphPointer } from 'clownface'
import { NotFoundError } from '../../errors'
import { ResourceStore } from '../../ResourceStore'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import { cc } from '@cube-creator/core/namespace'
import { resourceStore } from '../resources'

const trueTerm = $rdf.literal('true', xsd.boolean)

interface UpdateTableCommand {
  resource: GraphPointer
  store?: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
}

export async function updateTable({
  resource,
  store = resourceStore(),
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
} : UpdateTableCommand): Promise<GraphPointer> {
  const table = await store.getResource<Table>(resource.term)

  if (!table) {
    throw new NotFoundError(resource.term)
  }
  const label = resource.out(schema.name)
  if (!label?.value) {
    throw new Error('schema:name missing from the payload')
  }
  table.name = label.value

  const color = resource.out(schema.color)
  if (!color?.value) {
    throw new Error('schema:color missing from the payload')
  }
  table.color = color.value

  const identifierTemplate = resource.out(cc.identifierTemplate)
  if (!identifierTemplate?.value) {
    throw new Error('cc.identifierTemplate missing from the payload')
  }
  table.identifierTemplate = identifierTemplate.value

  const csvMapping = await store.getResource<CsvMapping>(table.csvMapping.id)
  if (!csvMapping) {
    throw new NotFoundError(csvMapping)
  }

  const isObservationTable = trueTerm.equals(resource.out(cc.isObservationTable).term)
  if (table.isObservationTable !== isObservationTable) {
    const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
    const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)
    if (!dimensionMetaDataCollection) {
      throw new NotFoundError(dimensionMetaDataCollectionPointer)
    }

    for (const columnMappingPointer of table.columnMappings) {
      const columnMapping = await store.getResource<ColumnMapping>(columnMappingPointer.id)
      if (!columnMapping) {
        throw new NotFoundError(columnMappingPointer.id)
      }

      if (isObservationTable) {
        dimensionMetaDataCollection.addDimensionMetadata({ store, columnMapping, csvMapping })
      } else {
        const dimensionMetadata = dimensionMetaDataCollection.find({ csvMapping, targetProperty: columnMapping.targetProperty })

        if (dimensionMetadata) {
          dimensionMetaDataCollection.deleteDimension(dimensionMetadata)
        }
      }
    }

    isObservationTable ? table.types.add(cc.ObservationTable) : table.types.delete(cc.ObservationTable)
  }

  await store.save()
  return table.pointer
}
