import prefixes from '@zazuko/rdf-vocabularies/prefixes'
import namespace from '@rdf-esm/namespace'
import '@zazuko/vocabulary-extras'

export { cube, meta, relation } from '@zazuko/vocabulary-extras/builders'
export { shape } from './namespaces/shapes'

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
  'BatchMappingAction'

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
  'projectSourceKind/ExportedProject'

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
  'Hierarchy'

prefixes.view = 'https://cube.link/view/'

export const query = namespace('http://hypermedia.app/query#')
export const view = namespace(prefixes.view)
export const hydraBox = namespace('http://hydra-box.org/schema/')
export const cc = namespace<CubeCreatorTerms>('https://cube-creator.zazuko.com/vocab#')
export const md = namespace<SharedDimensionsTerms>('https://cube-creator.zazuko.com/shared-dimensions/vocab#')
export const editor = namespace(cc.dash.value)
export const sh1 = namespace('https://forms.hypermedia.app/shaperone#')
export const hex = namespace('https://w3id.org/hydra/extension#')
export const iso6391 = namespace('http://lexvo.org/id/iso639-1/')
