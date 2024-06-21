import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import $rdf from '@cube-creator/env'
import { cc } from '@cube-creator/core/namespace'
import {
  ColumnMapping,
  CsvSource,
  DimensionMetadataCollection,
  LiteralColumnMapping,
  CsvProject,
  ReferenceColumnMapping,
  Table,
} from '@cube-creator/model'
import { NotFoundError, DomainError } from '@cube-creator/api-errors'
import { createIdentifierMapping } from '@cube-creator/model/ColumnMapping'
import type { Organization } from '@rdfine/schema'
import { Dictionary } from '@rdfine/prov'
import { ResourceStore } from '../../ResourceStore.js'
import { getDimensionMetaDataCollection } from '../queries/dimension-metadata.js'
import { getTableForColumnMapping } from '../queries/table.js'
import * as id from '../identifiers.js'
import { findOrganization } from '../organization/query.js'
import { findMapping } from './lib/index.js'

interface UpdateColumnMappingCommand {
  resource: GraphPointer
  store: ResourceStore
}

export async function updateLiteralColumnMapping({
  resource,
  store,
}: UpdateColumnMappingCommand): Promise<GraphPointer> {
  const { columnMapping, table } = await updateColumnMapping<LiteralColumnMapping>({
    resource,
    store,
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

  columnMapping.setErrors()

  return columnMapping.pointer
}

export async function updateReferenceColumnMapping({
  resource,
  store,
}: UpdateColumnMappingCommand): Promise<GraphPointer> {
  const { columnMapping, table } = await updateColumnMapping<ReferenceColumnMapping>({
    resource,
    store,
  })

  // Update referencedTable
  const referencedTableId = resource.out(cc.referencedTable).term!
  const referencedTable = await store.getResource<Table>(referencedTableId)

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
        $rdf,
        columnMapping.pointer.node(id.identifierMapping(columnMapping)),
        { sourceColumn, referencedColumn },
      )
    }))

  columnMapping.setErrors()

  return columnMapping.pointer
}

async function updateColumnMapping<T extends ColumnMapping>({
  resource,
  store,
}: UpdateColumnMappingCommand): Promise<{ columnMapping: T; table: Table }> {
  const columnMapping = await store.getResource<T>(resource.term)

  columnMapping.dimensionType = resource.out(cc.dimensionType).term

  const tableId = await getTableForColumnMapping(columnMapping.id as NamedNode)
  const table = await store.getResource<Table>(tableId)

  const targetProperty = resource.out(cc.targetProperty).term!

  if (targetProperty.value !== columnMapping.targetProperty.value) {
    if (table.isObservationTable) {
      const mappingExists = await findMapping(table, targetProperty, store)
      if (mappingExists) {
        throw new DomainError('Target property already mapped')
      }

      const { organizationId, projectId } = await findOrganization({ table })
      const organization = await store.getResource<Organization>(organizationId)
      const { cubeIdentifier } = await store.getResource<CsvProject>(projectId)
      const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
      const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)

      const dimension = dimensionMetaDataCollection.find({ cubeIdentifier, organization, targetProperty: columnMapping.targetProperty })
      if (!dimension) {
        throw new Error(`Mapping for property ${columnMapping.targetProperty.value} not found`)
      }

      dimension.about = organization.createIdentifier({
        cubeIdentifier,
        termName: targetProperty,
      })

      if (dimension.mappings) {
        const mappings = await store.getResource<Dictionary>(dimension.mappings)
        mappings.about = dimension.about
      }
    }

    columnMapping.targetProperty = targetProperty
  }

  return { columnMapping, table }
}
