import {
  ColumnMapping,
  DimensionMetadataCollection,
  CsvProject,
  Table,
  ReferenceColumnMapping,
} from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import { schema, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore.js'
import { getDimensionMetaDataCollection } from '../queries/dimension-metadata.js'
import * as ColumnMappingQueries from '../queries/column-mapping.js'
import { findOrganization } from '../organization/query.js'
import { getTableReferences } from '../queries/table.js'

const trueTerm = $rdf.literal('true', xsd.boolean)

interface UpdateTableCommand {
  resource: GraphPointer
  store: ResourceStore
  columnMappingQueries?: Pick<typeof ColumnMappingQueries, 'dimensionIsUsedByOtherMapping'>
}

export async function updateTable({
  resource,
  store,
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

  if (identifierTemplate.value !== table.identifierTemplate) {
    table.identifierTemplate = identifierTemplate.value || ''
    const csvSource = await store.getResource(table.csvSource)

    const columns = table.parsedTemplate.columnNames
      .map(columnName => {
        const column = csvSource.columns.find(({ name }) => columnName === name)
        if (column?.id.termType !== 'NamedNode') {
          throw new Error(`Unexpected column identifier ${column?.id}`)
        }

        return column.id
      })
    for await (const columnMappingId of getTableReferences(table)) {
      const columnMapping = await store.getResource<ReferenceColumnMapping>(columnMappingId)
      columnMapping.resetIdentifierMappings(columns)
      columnMapping.setErrors()
    }
  }

  const { projectId, organizationId } = await findOrganization({ table })
  const organization = await store.getResource<Organization>(organizationId)
  const { cubeIdentifier } = await store.getResource<CsvProject>(projectId)

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
