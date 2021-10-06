import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { cc } from '@cube-creator/core/namespace'
import type { Organization } from '@rdfine/schema'
import { ColumnMapping, DimensionMetadataCollection, CsvProject, Table } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'
import { getDimensionMetaDataCollection } from '../queries/dimension-metadata'
import * as TableQueries from '../queries/table'
import * as ColumnMappingQueries from '../queries/column-mapping'
import { findOrganization } from '../organization/query'

interface DeleteColumnMappingCommand {
  resource: NamedNode
  store: ResourceStore
  tableQueries?: Pick<typeof TableQueries, 'getTableForColumnMapping'>
  columnMappingQueries?: Pick<typeof ColumnMappingQueries, 'dimensionIsUsedByOtherMapping'>
}

export async function deleteColumnMapping({
  resource,
  store,
  tableQueries: { getTableForColumnMapping } = TableQueries,
  columnMappingQueries: { dimensionIsUsedByOtherMapping } = ColumnMappingQueries,
}: DeleteColumnMappingCommand): Promise<void> {
  const columnMapping = await store.getResource<ColumnMapping>(resource, { allowMissing: true })
  if (!columnMapping) return

  const tableId = await getTableForColumnMapping(columnMapping.id as NamedNode)
  const table = await store.getResource<Table>(tableId)

  table.pointer.dataset.delete($rdf.quad(table.pointer.term, cc.columnMapping, columnMapping.id))

  if (table.isObservationTable) {
    const { organizationId, projectId } = await findOrganization({ table })
    const organization = await store.getResource<Organization>(organizationId)
    const { cubeIdentifier } = await store.getResource<CsvProject>(projectId)
    const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
    const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)

    const dimension = dimensionMetaDataCollection.find({ cubeIdentifier, organization, targetProperty: columnMapping.targetProperty })
    const isInUse = await dimensionIsUsedByOtherMapping(columnMapping.id)
    if (dimension && dimension.id.termType === 'NamedNode' && !isInUse) {
      dimensionMetaDataCollection.deleteDimension(dimension)
    }
  }

  // Delete Graph
  store.delete(resource)
}
