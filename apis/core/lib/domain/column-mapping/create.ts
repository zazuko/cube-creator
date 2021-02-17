import { GraphPointer } from 'clownface'
import { cc } from '@cube-creator/core/namespace'
import { ResourceStore } from '../../ResourceStore'
import { NamedNode, Term } from 'rdf-js'
import {
  CsvSource,
  DimensionMetadataCollection,
  LiteralColumnMapping,
  Project,
  ReferenceColumnMapping,
  Table,
} from '@cube-creator/model'
import { getDimensionMetaDataCollection } from '../queries/dimension-metadata'
import { findMapping } from './lib'
import { NotFoundError, DomainError } from '../../errors'
import { rdf } from '@tpluscode/rdf-ns-builders'
import TermSet from '@rdfjs/term-set'
import type { Organization } from '@rdfine/schema'
import { findOrganization } from '../organization/query'

interface CreateColumnMappingCommand {
  tableId: NamedNode
  resource: GraphPointer
  store: ResourceStore
}

export async function createColumnMapping({
  tableId,
  resource,
  store,
}: CreateColumnMappingCommand): Promise<GraphPointer> {
  const table = await store.getResource<Table>(tableId)

  const targetProperty = resource.out(cc.targetProperty).term!
  if (table.isObservationTable) {
    const mappingExists = await findMapping(table, targetProperty, store)
    if (mappingExists) {
      throw new DomainError('Target property already mapped')
    }
  }

  const source = await store.getResource<CsvSource>(table.csvSource?.id)

  const resourceTypes = new TermSet(resource.out(rdf.type).terms)
  const columnMapping = resourceTypes.has(cc.ReferenceColumnMapping)
    ? await createReferenceColumnMapping({ targetProperty, table, source, resource, store })
    : await createLiteralColumnMapping({ targetProperty, table, source, resource, store })

  if (table.types.has(cc.ObservationTable)) {
    const { organizationId, projectId } = await findOrganization({ table })
    const organization = await store.getResource<Organization>(organizationId)
    const { cubeIdentifier } = await store.getResource<Project>(projectId)
    const dimensionMetaDataCollectionPointer = await getDimensionMetaDataCollection(table.csvMapping.id)
    const dimensionMetaDataCollection = await store.getResource<DimensionMetadataCollection>(dimensionMetaDataCollectionPointer)

    dimensionMetaDataCollection.addDimensionMetadata({
      store,
      columnMapping,
      organization,
      cubeIdentifier,
    })
  }

  return columnMapping.pointer
}

interface CreateLiteralColumnMappingCommand {
  targetProperty: Term
  table: Table
  source: CsvSource
  resource: GraphPointer
  store: ResourceStore
}

async function createLiteralColumnMapping({ targetProperty, table, source, resource, store }: CreateLiteralColumnMappingCommand): Promise<LiteralColumnMapping> {
  const columnId = resource.out(cc.sourceColumn).term as NamedNode
  const column = source?.columns.find(({ id }) => id.equals(columnId))

  if (!column) {
    throw new NotFoundError(columnId)
  }

  return table.addLiteralColumnMapping({
    store,
    sourceColumn: column,
    targetProperty,
    datatype: resource.out(cc.datatype).term as NamedNode,
    language: resource.out(cc.language).value,
    defaultValue: resource.out(cc.defaultValue).term,
  })
}

interface CreateReferenceColumnMappingCommand {
  targetProperty: Term
  table: Table
  source: CsvSource
  resource: GraphPointer
  store: ResourceStore
}

async function createReferenceColumnMapping({ targetProperty, table, source, resource, store }: CreateReferenceColumnMappingCommand): Promise<ReferenceColumnMapping> {
  const referencedTableId = resource.out(cc.referencedTable).term
  const referencedTable = await store.getResource<Table>(referencedTableId)
  const referencedSource = await store.getResource<CsvSource>(referencedTable.csvSource?.id)

  const identifierMappings = await Promise.all(resource.out(cc.identifierMapping).map(async (identifierMapping) => {
    const sourceColumnId = identifierMapping.out(cc.sourceColumn).term!
    const sourceColumn = source.columns.find(({ id }) => id.equals(sourceColumnId))
    if (!sourceColumn) throw new DomainError(`${sourceColumnId.value} not found in source`)

    const referencedColumnId = identifierMapping.out(cc.referencedColumn).term!
    const referencedColumn = referencedSource.columns.find(({ id }) => id.equals(referencedColumnId))
    if (!referencedColumn) throw new DomainError(`${referencedColumnId.value} not found in referenced source`)

    return {
      sourceColumn,
      referencedColumn,
    }
  }))

  return table.addReferenceColumnMapping({
    store,
    targetProperty,
    referencedTable,
    identifierMappings,
  })
}
