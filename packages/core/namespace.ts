import prefixes from '@zazuko/prefixes'
import rdf from '@zazuko/env'
import '@zazuko/vocabulary-extras/register'

export { cube } from '@zazuko/vocabulary-extras/builders/loose'
export { meta, relation } from '@zazuko/vocabulary-extras/builders/loose' // TODO: do not use loose builders
export { shape } from './namespaces/shapes.js'

type CubeCreatorClass =
  'CubeProject' |
  'ProjectsCollection' |
  'CsvMapping' |
  'EntryPoint' |
  'CSVSource' |
  'CSVSourceCollection' |
  'Table' |
  'TableCollection' |
  'ObservationTable' |
  'ColumnMapping' |
  'LiteralColumnMapping' |
  'ReferenceColumnMapping' |
  'CreateLiteralColumnMappingAction' |
  'CreateReferenceColumnMappingAction' |
  'Job' |
  'JobCollection' |
  'TransformAction' |
  'ImportAction' |
  'PublishAction' |
  'UnlistAction' |
  'DimensionMetadataCollection' |
  'SharedDimensionsCollection' |
  'Observations' |
  'TransformJob' |
  'ImportJob' |
  'PublishJob' |
  'UnlistJob' |
  'ReplaceCSVAction' |
  'MediaLocal' |
  'MediaURL' |
  'OriginalValuePredicate' |
  'BatchMappingAction' |
  'UserCollection'

type CubeCreatorProperty =
  'projectSourceKind' |
  'projects' |
  'csvMapping' |
  'csvSource' |
  'csvSourceCollection' |
  'csvColumnSample' |
  'sourceKind' |
  'csvw' |
  'tables' |
  'identifierTemplate' |
  'project' |
  'dataset' |
  'namespace' |
  'cubeGraph' |
  'columnMapping' |
  'sourceColumn' |
  'targetProperty' |
  'identifierMapping' |
  'referencedTable' |
  'referencedColumn' |
  'datatype' |
  'language' |
  'defaultValue' |
  'isObservationTable' |
  'cube' |
  'jobCollection' |
  'dimensionMetadata' |
  'observations' |
  'publishGraph' |
  'latestPublishedRevision' |
  'revision' |
  'dimensionMapping' |
  'sharedDimension' |
  'sharedDimensions' |
  'dimensionType' |
  'CubeProject/sourceCube' |
  'CubeProject/sourceEndpoint' |
  'CubeProject/sourceGraph' |
  'export' |
  'projectDetails' |
  'validationReport' |
  'batchMapping'

type OtherTerms =
  'dash' |
  'projectSourceKind/CSV' |
  'projectSourceKind/ExistingCube' |
  'projectSourceKind/ExportedProject' |
  'CanceledJobStatus'

type MetaDataProperty =
  'publishOnOpendata' |
  'publishOnVisualize'

type CubeCreatorTerms = CubeCreatorClass | CubeCreatorProperty | OtherTerms | MetaDataProperty

type SharedDimensionsTerms =
  'SharedDimension' |
  'SharedDimensions' |
  'SharedDimensionTerm' |
  'SharedDimensionTerms' |
  'SharedDimensionExport' |
  'sharedDimensions' |
  'sharedDimension' |
  'terms' |
  'onlyValidTerms' |
  'export' |
  'createAs' |
  'dynamicPropertyType' |
  'hierarchies' |
  'Hierarchies' |
  'Hierarchy' |
  'Entrypoint' |
  'FreeTextSearchConstraintComponent'

prefixes.view = 'https://cube.link/view/'

export const query = rdf.namespace('http://hypermedia.app/query#')
export const view = rdf.namespace(prefixes.view)
export const hydraBox = rdf.namespace('http://hydra-box.org/schema/')
export const cc = rdf.namespace<CubeCreatorTerms>('https://cube-creator.zazuko.com/vocab#')
export const md = rdf.namespace<SharedDimensionsTerms>('https://cube-creator.zazuko.com/shared-dimensions/vocab#')
export const editor = rdf.namespace(cc.dash.value)
export const sh1 = rdf.namespace('https://hypermedia.app/shaperone#')
export const hex = rdf.namespace('https://w3id.org/hydra/extension#')
export const iso6391 = rdf.namespace('http://lexvo.org/id/iso639-1/')
export const lindasSchema = rdf.namespace('https://schema.ld.admin.ch/')
