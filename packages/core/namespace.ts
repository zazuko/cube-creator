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
  'ColumnMapping' |
  'Job' |
  'JobCollection'

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
  'cube' |
  'jobCollection'

type OtherTerms =
  'dash'

type CubeCreatorNamespace = Record<CubeCreatorClass | CubeCreatorProperty | OtherTerms, NamedNode>

export const hashi = namespace('http://hypermedia.app/shapes#')
export const cube = namespace('http://ns.bergnet.org/cube/')
export const cc: CubeCreatorNamespace = namespace('https://cube-creator.zazuko.com/vocab#') as any
export const editor = namespace(cc.dash.value)
