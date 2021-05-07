import { GraphPointer } from 'clownface'
import { csvw, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { NamedNode } from 'rdf-js'
import $rdf from 'rdf-ext'
import { CsvColumn, CsvMapping, CsvSource, DimensionMetadataCollection, CsvProject } from '@cube-creator/model'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import type { Organization } from '@rdfine/schema'
import { findOrganization } from '../organization/query'

const trueTerm = $rdf.literal('true', xsd.boolean)

interface CreateTableCommand {
  tableCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
}

export async function createTable({
  tableCollection,
  resource,
  store,
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
}: CreateTableCommand): Promise<GraphPointer> {
  const label = resource.out(schema.name)
  if (!label?.value) {
    throw new Error('schema:name missing from the payload')
  }

  const csvMappingPointer = tableCollection.out(cc.csvMapping)
  if (csvMappingPointer?.term?.termType !== 'NamedNode') {
    throw new Error('cc:csvMapping missing from the payload')
  }

  const csvMapping = await store.getResource<CsvMapping>(csvMappingPointer.term)
  const csvSourceId = resource.out(cc.csvSource).term
  const csvSource = await store.getResource<CsvSource>(csvSourceId)
  const { organizationId, projectId } = await findOrganization({ csvMapping })
  const organization = await store.getResource<Organization>(organizationId)
  const { cubeIdentifier } = await store.getResource<CsvProject>(projectId)

  const columns = [...csvSource.columns]

  const columnsToAdd = resource.out(csvw.column)
    .map(({ term: columnId }) => {
      const column = columns
        .find(({ id }) => id.equals(columnId))
      if (!column) {
        throw new Error(`Column ${columnId} not found`)
      }
      return column
    })

  const table = await csvMapping.addTable(store, {
    name: label.value,
    csvSource,
    identifierTemplate: getTemplate(resource.out(cc.identifierTemplate).value, columnsToAdd),
    color: resource.out(schema.color).value,
    isObservationTable: trueTerm.equals(resource.out(cc.isObservationTable).term),
  })

  // Create default column mappings for provided columns
  const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(csvMapping.id)
  const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)

  // Create default column mappings for provided columns
  columnsToAdd
    .forEach((column: CsvColumn) => {
      const columnMapping = table.addColumnMappingFromColumn({
        store,
        column,
      })

      if (table.types.has(cc.ObservationTable)) {
        dimensionMetaDataCollection.addDimensionMetadata({
          store, columnMapping, organization, cubeIdentifier,
        })
      }

      return columnMapping
    })

  return table.pointer
}

function getTemplate(template: string | undefined, columns: CsvColumn[]): string {
  if (template?.trim()) return template
  return columns.sort((a, b) => (a.order - b.order)).map((column) => `{${column.name}}`).join('/')
}
