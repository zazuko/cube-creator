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
  'UploadCSVAction' |
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
  'PublishAction' |
  'DimensionMetadataCollection' |
  'ManagedDimensionsCollection' |
  'Observations' |
  'TransformJob' |
  'PublishJob' |
  'ReplaceCSVAction'

type CubeCreatorProperty =
  'projectSourceKind' |
  'projects' |
  'csvMapping' |
  'csvSource' |
  'csvSourceCollection' |
  'csvColumnSample' |
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
  'managedDimension' |
  'managedDimensions' |
  'applyMappings'

type OtherTerms =
  'dash'

type MetaDataProperty =
  'publishOnOpendata' |
  'publishOnVisualize'

type CubeCreatorTerms = CubeCreatorClass | CubeCreatorProperty | OtherTerms | MetaDataProperty

type ManagedDimensionsTerms =
  'ManagedDimension' |
  'ManagedDimensions' |
  'ManagedDimensionTerms' |
  'managedDimensions' |
  'terms'

type MetaTerms =
  'SharedDimension' |
  'dataKind'

prefixes.freq = 'http://purl.org/cld/freq/'
prefixes.cube = 'https://cube.link/'
prefixes.view = 'https://cube.link/view/'
prefixes.meta = 'https://cube.link/meta/'

export const query = namespace('http://hypermedia.app/query#')
export const cube = namespace(prefixes.cube)
export const meta = namespace<MetaTerms>(prefixes.meta)
export const view = namespace(prefixes.view)
export const hydraBox = namespace('http://hydra-box.org/schema/')
export const cc = namespace<CubeCreatorTerms>('https://cube-creator.zazuko.com/vocab#')
export const md = namespace<ManagedDimensionsTerms>('https://cube-creator.zazuko.com/managed-dimensions/vocab#')
export const editor = namespace(cc.dash.value)
export const freq = namespace(prefixes.freq)
export const sh1 = namespace('https://forms.hypermedia.app/shaperone#')
