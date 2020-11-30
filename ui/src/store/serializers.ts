import { Actions } from '@/api/mixins/ApiResource'
import { ColumnMapping, CsvColumn, CsvSource, DimensionMetadata, DimensionMetadataCollection, JobCollection, SourcesCollection, Table, TableCollection } from '@cube-creator/model'
import { RdfResource } from '@tpluscode/rdfine/RdfResource'

export function serializeSourcesCollection (collection: SourcesCollection): SourcesCollection {
  return Object.freeze({
    ...serializeResource(collection),
    actions: {
      ...serializeActions(collection.actions),
      upload: collection.actions.upload,
    },
    member: collection.member.map(serializeSource),
  }) as unknown as SourcesCollection
}

export function serializeSource (source: CsvSource): CsvSource {
  return Object.freeze({
    ...serializeResource(source),
    name: source.name,
    columns: source.columns.map(serializeColumn),
    dialect: source.dialect,
    csvMapping: source.csvMapping,
  }) as CsvSource
}

export function serializeColumn (column: CsvColumn): CsvColumn {
  return Object.freeze({
    ...serializeResource(column),
    name: column.name,
    samples: column.samples,
    order: column.order,
  }) as CsvColumn
}

export function serializeTableCollection (collection: TableCollection): TableCollection {
  return Object.freeze({
    ...serializeResource(collection),
    member: collection.member.map(serializeTable),
  }) as TableCollection
}

export function serializeTable (table: Table): Table {
  return Object.freeze({
    ...serializeResource(table),
    actions: {
      ...serializeActions(table.actions),
      createColumnMapping: table.actions.createColumnMapping,
    },
    name: table.name,
    csvSource: table.csvSource,
    color: table.color,
    identifierTemplate: table.identifierTemplate,
    isObservationTable: table.isObservationTable,
    columnMappings: table.columnMappings.map(serializeColumnMapping),
    csvMapping: table.csvMapping,
    csvw: table.csvw,
  })
}

export function serializeColumnMapping (columnMapping: ColumnMapping): ColumnMapping {
  return Object.freeze({
    ...serializeResource(columnMapping),
    sourceColumn: columnMapping.sourceColumn,
    targetProperty: columnMapping.targetProperty,
  })
}

export function serializeDimensionMetadataCollection (collection: DimensionMetadataCollection): DimensionMetadataCollection {
  return Object.freeze({
    ...serializeResource(collection),
    hasPart: collection.hasPart.map(serializeDimensionMetadata),
  }) as DimensionMetadataCollection
}

export function serializeDimensionMetadata (dimension: DimensionMetadata): DimensionMetadata {
  return Object.freeze({
    ...serializeResource(dimension),
    name: dimension.name,
    about: dimension.about,
  })
}

export function serializeJobCollection (collection: JobCollection): JobCollection {
  return Object.freeze({
    ...serializeResource(collection),
    member: collection.member.map(Object.freeze),
  }) as JobCollection
}

export function serializeResource (resource: RdfResource): RdfResource {
  return {
    id: resource.id,
    clientPath: resource.clientPath,
    actions: serializeActions(resource.actions),
    pointer: Object.freeze(resource.pointer),
  } as RdfResource
}

export function serializeActions (actions: Actions): Actions {
  return Object.freeze({
    create: actions.create,
    edit: actions.edit,
    delete: actions.delete,
  })
}
