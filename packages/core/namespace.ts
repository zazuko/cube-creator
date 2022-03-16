import prefixes from '@zazuko/rdf-vocabularies/prefixes'
import namespace from '@rdf-esm/namespace'

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
  'OriginalValuePredicate'

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
  'applyMappings' |
  'dimensionType' |
  'CubeProject/sourceCube' |
  'CubeProject/sourceEndpoint' |
  'CubeProject/sourceGraph' |
  'export' |
  'projectDetails' |
  'validationReport'

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

type MetaTerms =
  'SharedDimension' |
  'dataKind' |
  'DimensionRelation' |
  'dimensionRelation' |
  'relatesTo' |
  'hasHierarchy' |
  'hierarchyRoot' |
  'nextInHierarchy' |
  'Hierarchy'

prefixes.cube = 'https://cube.link/'
prefixes.view = 'https://cube.link/view/'
prefixes.meta = 'https://cube.link/meta/'
prefixes.relation = 'https://cube.link/relation/'

export const query = namespace('http://hypermedia.app/query#')
export const cube = namespace(prefixes.cube)
export const meta = namespace<MetaTerms>(prefixes.meta)
export const view = namespace(prefixes.view)
export const relation = namespace(prefixes.relation)
export const hydraBox = namespace('http://hydra-box.org/schema/')
export const cc = namespace<CubeCreatorTerms>('https://cube-creator.zazuko.com/vocab#')
export const md = namespace<SharedDimensionsTerms>('https://cube-creator.zazuko.com/shared-dimensions/vocab#')
export const editor = namespace(cc.dash.value)
export const sh1 = namespace('https://forms.hypermedia.app/shaperone#')
export const hex = namespace('https://w3id.org/hydra/extension#')
export const iso6391 = namespace('http://lexvo.org/id/iso639-1/')
