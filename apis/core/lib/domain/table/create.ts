import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { csvw, schema, xsd } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import {
  CsvColumn,
  CsvMapping,
  CsvSource,
  DimensionMetadataCollection,
  CsvProject,
  ColumnMapping,
  Table,
} from '@cube-creator/model'
import type { Organization } from '@rdfine/schema'
import TermSet from '@rdfjs/term-set'
import { DomainError } from '@cube-creator/api-errors'
import * as DimensionMetadataQueries from '../queries/dimension-metadata'
import { ResourceStore } from '../../ResourceStore'
import { findOrganization } from '../organization/query'
import * as TableQueries from '../queries/table'

const trueTerm = $rdf.literal('true', xsd.boolean)

interface CreateTableCommand {
  tableCollection: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
  dimensionMetadataQueries?: Pick<typeof DimensionMetadataQueries, 'getDimensionMetaDataCollection'>
  tableQueries?: Pick<typeof TableQueries, 'getCubeTables'>
}

export async function createTable({
  tableCollection,
  resource,
  store,
  dimensionMetadataQueries: { getDimensionMetaDataCollection } = DimensionMetadataQueries,
  tableQueries: { getCubeTables } = TableQueries,
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
        throw new Error(`Column ${columnId.value} not found`)
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

  if (table.isObservationTable) {
    await assertNoDuplicateTargetProperties(
      table,
      store,
      organization,
      cubeIdentifier,
    )

    const currentCubeTable = (await getCubeTables(csvMapping)).shift()
    if (currentCubeTable) {
      throw new DomainError('A project can have only one cube table')
    }
  }

  return table.pointer
}

async function assertNoDuplicateTargetProperties(table: Table, store: ResourceStore, organization: Organization, cubeIdentifier: string) {
  const targetProperties = new TermSet(
    await Promise.all(
      table.columnMappings.map(async link => {
        const columnMapping = await store.getResource<ColumnMapping>(link.id)
        return organization.createIdentifier({
          cubeIdentifier,
          termName: columnMapping.targetProperty,
        })
      }),
    ),
  )

  if (targetProperties.size < table.columnMappings.length) {
    throw new DomainError('Cannot create table with duplicate target properties')
  }
}

function getTemplate(template: string | undefined, columns: CsvColumn[]): string {
  if (template?.trim()) return template
  return columns.sort((a, b) => (a.order - b.order)).map((column) => `{${column.name}}`).join('/')
}
