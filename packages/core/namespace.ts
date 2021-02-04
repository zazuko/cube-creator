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
  'ReplaceCSVAction' |
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
  'revision'

type OtherTerms =
  'dash'

type MetaDataProperty =
  'publishOnOpendata' |
  'publishOnVisualize'

type CubeCreatorTerms = CubeCreatorClass | CubeCreatorProperty | OtherTerms | MetaDataProperty

prefixes.freq = 'http://purl.org/cld/freq/'
prefixes.cube = 'http://ns.bergnet.org/cube/'
prefixes.view = 'http://ns.bergnet.org/cube-view/'

export const query = namespace('http://hypermedia.app/query#')
export const cube = namespace(prefixes.cube)
export const view = namespace(prefixes.view)
export const hydraBox = namespace('http://hydra-box.org/schema/')
export const cc = namespace<CubeCreatorTerms>('https://cube-creator.zazuko.com/vocab#')
export const editor = namespace(cc.dash.value)
export const freq = namespace(prefixes.freq)
export const sh1 = namespace('https://forms.hypermedia.app/shaperone#')
