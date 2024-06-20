import type { NamedNode } from '@rdfjs/types'
import $rdf from '@zazuko/env'
import { cc } from '@cube-creator/core/namespace'
import type { Organization } from '@rdfine/schema'
import { ColumnMapping, DimensionMetadataCollection, CsvProject, Table } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore.js'
import { getDimensionMetaDataCollection } from '../queries/dimension-metadata.js'
import * as TableQueries from '../queries/table.js'
import * as ColumnMappingQueries from '../queries/column-mapping.js'
import { findOrganization } from '../organization/query.js'
import { getTableForColumnMapping } from '../queries/table.js'
import { dimensionIsUsedByOtherMapping } from '../queries/column-mapping.js'

interface DeleteColumnMappingCommand {
  resource: NamedNode
  store: ResourceStore
  tableQueries?: Pick<typeof TableQueries, 'getTableForColumnMapping'>
  columnMappingQueries?: Pick<typeof ColumnMappingQueries, 'dimensionIsUsedByOtherMapping'>
}

export async function deleteColumnMapping({
  resource,
  store,
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
      if (dimension.mappings) {
        store.delete(dimension.mappings)
      }
      dimensionMetaDataCollection.deleteDimension(dimension)
    }
  }

  // Delete Graph
  store.delete(resource)
}
