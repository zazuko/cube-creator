import { Actions } from '@/api/mixins/ApiResource'
import { cc, cube, meta } from '@cube-creator/core/namespace'
import {
  ColumnMapping,
  CsvColumn,
  CubeProject,
  CsvSource,
  Cube,
  Dataset,
  DimensionMetadata,
  DimensionMetadataCollection,
  JobCollection,
  ProjectsCollection,
  SourcesCollection,
  Table,
  TableCollection,
} from '@cube-creator/model'
import { IdentifierMapping, LiteralColumnMapping, ReferenceColumnMapping } from '@cube-creator/model/ColumnMapping'
import { Link } from '@cube-creator/model/lib/Link'
import { dcterms, oa, rdf, rdfs, schema } from '@tpluscode/rdf-ns-builders'
import { RdfResource, ResourceIdentifier } from '@tpluscode/rdfine/RdfResource'
import { ProjectDetails, SharedDimensionTerm } from './types'
import { clone } from '@/store/searchParams'

export const displayLanguage = ['en', 'de', 'fr', '']

export function serializeProjectsCollection (collection: ProjectsCollection): ProjectsCollection {
  return Object.freeze({
    ...serializeResource(collection),
    searchParams: clone(collection.pointer),
    member: collection.member.sort(sortProject),
  }) as ProjectsCollection
}

function sortProject (a: CubeProject, b: CubeProject) {
  const aPlannedUpdate = a.plannedNextUpdate?.toISOString()
  if (!aPlannedUpdate) {
    return 1
  }

  const bPlannedUpdate = b.plannedNextUpdate?.toISOString()
  if (!bPlannedUpdate) {
    return -1
  }

  return aPlannedUpdate.localeCompare(bPlannedUpdate) || a.label.localeCompare(b.label)
}

export function serializeProjectDetails (details: RdfResource): ProjectDetails {
  return Object.freeze({
    ...serializeResource(details),
    parts: details.pointer.out(schema.hasPart).map(part => ({
      id: part.term as ResourceIdentifier,
      name: part.out(schema.name).value,
      values: part.out(schema.value).terms,
    })),
  })
}

export function serializeSourcesCollection (collection: SourcesCollection): SourcesCollection {
  return Object.freeze({
    ...serializeResource(collection),
    member: collection.member.map(serializeSource),
  }) as unknown as SourcesCollection
}

export function serializeSource (source: CsvSource): CsvSource {
  return Object.freeze({
    ...serializeResource(source),
    actions: {
      ...serializeActions(source.actions),
      replace: source.actions.replace,
      download: source.actions.download,
    },
    name: source.name,
    errorMessages: source.errorMessages,
    columns: source.columns.map(serializeColumn),
    dialect: source.dialect,
    csvMapping: source.csvMapping,
    associatedMedia: Object.freeze(source.associatedMedia),
  }) as unknown as CsvSource
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
  return {
    ...serializeResource(table),
    actions: {
      ...serializeActions(table.actions),
      createLiteralColumnMapping: table.actions.createLiteralColumnMapping,
      createReferenceColumnMapping: table.actions.createReferenceColumnMapping,
    },
    name: table.name,
    csvSource: table.csvSource,
    color: table.color,
    identifierTemplate: table.identifierTemplate,
    isObservationTable: table.isObservationTable,
    columnMappings: table.columnMappings.map(serializeColumnMapping),
    csvMapping: table.csvMapping,
    csvw: table.csvw,
    parsedTemplate: table.parsedTemplate,
  }
}

export function serializeColumnMapping (columnMapping: ColumnMapping): ReferenceColumnMapping | LiteralColumnMapping {
  return columnMapping.types.has(cc.LiteralColumnMapping)
    ? serializeLiteralColumnMapping(columnMapping as LiteralColumnMapping)
    : serializeReferenceColumnMapping(columnMapping as ReferenceColumnMapping)
}

export function serializeLiteralColumnMapping (columnMapping: LiteralColumnMapping): LiteralColumnMapping {
  return Object.freeze({
    ...serializeResource(columnMapping),
    targetProperty: columnMapping.targetProperty,
    sourceColumn: Object.freeze(columnMapping.sourceColumn),
    datatype: columnMapping.datatype,
    language: columnMapping.language,
    dimensionType: columnMapping.dimensionType,
    isMeasureDimension: cube.MeasureDimension.equals(columnMapping.dimensionType),
    isKeyDimension: cube.KeyDimension.equals(columnMapping.dimensionType),
  })
}

export function serializeReferenceColumnMapping (columnMapping: ReferenceColumnMapping): ReferenceColumnMapping {
  return Object.freeze({
    ...serializeResource(columnMapping),
    targetProperty: columnMapping.targetProperty,
    referencedTable: serializeLink<Table>(columnMapping.referencedTable),
    identifierMapping: columnMapping.identifierMapping.map(serializeIdentifierMapping),
    dimensionType: columnMapping.dimensionType,
    isMeasureDimension: cube.MeasureDimension.equals(columnMapping.dimensionType),
    isKeyDimension: cube.KeyDimension.equals(columnMapping.dimensionType),
  })
}

export function serializeIdentifierMapping (identifierMapping: IdentifierMapping): IdentifierMapping {
  return Object.freeze({
    ...serializeResource(identifierMapping),
    sourceColumn: identifierMapping.sourceColumn ? serializeLink<CsvColumn>(identifierMapping.sourceColumn) : undefined,
    referencedColumn: serializeLink<CsvColumn>(identifierMapping.referencedColumn),
  })
}

export function serializeDimensionMetadataCollection (collection: DimensionMetadataCollection): DimensionMetadataCollection {
  return Object.freeze({
    ...serializeResource(collection),
    hasPart: collection.hasPart.map(serializeDimensionMetadata),
  }) as DimensionMetadataCollection
}

export function serializeDimensionMetadata (dimension: DimensionMetadata): DimensionMetadata {
  const sharedDimensions = dimension.pointer.out(cc.dimensionMapping).out(cc.sharedDimension)

  const dataKind = dimension.dataKind
    ? dimension.pointer.node(dimension.dataKind).out(rdf.type).term
    : undefined

  return Object.freeze({
    ...serializeResource(dimension),
    name: dimension.name,
    about: dimension.about,
    description: dimension.description,
    scaleOfMeasure: dimension.scaleOfMeasure,
    dataKind,
    mappings: dimension.mappings,
    sharedDimensions: sharedDimensions.map(sharedDimension => ({
      id: sharedDimension.term,
      label: sharedDimension.out([rdfs.label, schema.name], { language: displayLanguage }),
    })),
    isKeyDimension: dimension.isKeyDimension,
    isMeasureDimension: dimension.isMeasureDimension,
    order: dimension.order,
    hierarchies: dimension.getArray(meta.inHierarchy)
  })
}

export function serializeJobCollection (collection: JobCollection): JobCollection {
  const members = collection.member ?? []

  return {
    ...serializeResource(collection),
    actions: {
      ...serializeActions(collection.actions),
      createTransform: collection.actions.createTransform,
      createPublish: collection.actions.createPublish,
      createUnlist: collection.actions.createUnlist,
      createImport: collection.actions.createImport,
    },
    member: members.map(Object.freeze),
  } as unknown as JobCollection
}

export function serializeCubeMetadata (cubeMetadata: Dataset): Dataset {
  return {
    ...serializeResource(cubeMetadata),
    title: cubeMetadata.pointer.out(dcterms.title).terms,
    hasPart: cubeMetadata.hasPart.map(serializeCube),
    dimensionMetadata: serializeLink(cubeMetadata.dimensionMetadata),
  } as Dataset
}

export function serializeCube (cube: Cube): Cube {
  return {
    id: cube.id,
    observations: cube.observations,
    creator: cube.creator,
    dateCreated: cube.dateCreated,
  } as Cube
}

export function serializeSharedDimensionTerm (term: RdfResource): SharedDimensionTerm {
  const validThrough = term.pointer.out(schema.validThrough).value

  return Object.freeze({
    ...serializeResource(term),
    name: term.pointer.out(schema.name).terms,
    identifiers: term.pointer.out(schema.identifier).values,
    validThrough: validThrough ? new Date(validThrough) : undefined,
    canonical: term.pointer.out(oa.canonical).term,
  })
}

export function serializeResource (resource: RdfResource): RdfResource {
  return {
    id: resource.id,
    types: Object.freeze(resource.types),
    clientPath: resource.clientPath,
    actions: serializeActions(resource.actions),
    pointer: Object.freeze(resource.pointer),
    errors: resource.errors,
  } as RdfResource
}

export function serializeLink<T extends RdfResource> (resource: Link<T>): Link<T> {
  return {
    id: resource.id,
  } as Link<T>
}

export function serializeActions (actions: Actions): Actions {
  return Object.freeze({
    get: actions.get,
    create: actions.create,
    edit: actions.edit,
    replace: actions.replace,
    delete: actions.delete,
  })
}
