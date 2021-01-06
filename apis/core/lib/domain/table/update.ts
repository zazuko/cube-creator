import { ColumnMapping, DimensionMetadataCollection, Project, Table } from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from 'rdf-ext'
import { GraphPointer } from 'clownface'
import { ResourceStore } from '../../ResourceStore'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import { cc } from '@cube-creator/core/namespace'
import * as ColumnMappingQueries from '../queries/column-mapping'
import { findOrganization } from '../organization/query'

const trueTerm = $rdf.literal('true', xsd.boolean)

interface UpdateTableCommand {
  resource: GraphPointer
  store: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
  columnMappingQueries?: Pick<typeof ColumnMappingQueries, 'dimensionIsUsedByOtherMapping'>
}

export async function updateTable({
  resource,
  store,
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
  columnMappingQueries: { dimensionIsUsedByOtherMapping } = ColumnMappingQueries,
} : UpdateTableCommand): Promise<GraphPointer> {
  const table = await store.getResource<Table>(resource.term)

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

  const { projectId, organizationId } = await findOrganization({ table })
  const organization = await store.getResource<Organization>(organizationId)
  const { cubeIdentifier } = await store.getResource<Project>(projectId)

  const isObservationTable = trueTerm.equals(resource.out(cc.isObservationTable).term)
  if (table.isObservationTable !== isObservationTable) {
    const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
    const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)

    for (const columnMappingPointer of table.columnMappings) {
      const columnMapping = await store.getResource<ColumnMapping>(columnMappingPointer.id)

      if (isObservationTable) {
        dimensionMetaDataCollection.addDimensionMetadata({ cubeIdentifier, store, columnMapping, organization })
      } else {
        const dimensionMetadata = dimensionMetaDataCollection.find({ cubeIdentifier, organization, targetProperty: columnMapping.targetProperty })
        const isInUse = await dimensionIsUsedByOtherMapping(columnMapping.id)
        if (dimensionMetadata && !isInUse) {
          dimensionMetaDataCollection.deleteDimension(dimensionMetadata)
        }
      }
    }

    isObservationTable ? table.types.add(cc.ObservationTable) : table.types.delete(cc.ObservationTable)
  }

  return table.pointer
}
