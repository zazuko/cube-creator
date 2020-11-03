import namespace from '@rdf-esm/namespace'
import { NamedNode } from 'rdf-js'

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
  'ColumnMapping'

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
  'isObservationTable' |
  'cube'

type OtherTerms =
  'dash'

type MetaDataProperty =
  'PublishOnOpendata' |
  'PublishOnVisualize'

type CubeCreatorNamespace = Record<CubeCreatorClass | CubeCreatorProperty | OtherTerms | MetaDataProperty, NamedNode>

export const hashi = namespace('http://hypermedia.app/shapes#')
export const cube = namespace('http://ns.bergnet.org/cube/')
export const cc: CubeCreatorNamespace = namespace('https://cube-creator.zazuko.com/vocab#') as any
export const editor = namespace(cc.dash.value)
