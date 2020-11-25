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
  'CreateColumnMappingAction' |
  'Job' |
  'JobCollection' |
  'TransformAction' |
  'DimensionMetadataCollection'

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
  'datatype' |
  'language' |
  'defaultValue' |
  'isObservationTable' |
  'cube' |
  'jobCollection' |
  'dimensionMetadata'

type OtherTerms =
  'dash'

type MetaDataProperty =
  'publishOnOpendata' |
  'publishOnVisualize'

type CubeCreatorTerms = CubeCreatorClass | CubeCreatorProperty | OtherTerms | MetaDataProperty

prefixes.scale = 'http://ns.bergnet.org/cube/scale/'
prefixes.freq = 'http://purl.org/cld/freq/'
prefixes.cube = 'http://ns.bergnet.org/cube/'

export const hashi = namespace('http://hypermedia.app/shapes#')
export const cube = namespace(prefixes.cube)
export const cc = namespace<CubeCreatorTerms>('https://cube-creator.zazuko.com/vocab#')
export const editor = namespace(cc.dash.value)
export const freq = namespace(prefixes.freq)
export const scale = namespace(prefixes.scale)
