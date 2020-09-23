import namespace from '@rdfjs/namespace'
import { NamedNode } from 'rdf-js'

type CubeCreatorClass =
  'CubeProject' |
  'ProjectsCollection' |
  'CsvMapping' |
  'EntryPoint'

type CubeCreatorProperty =
  'projectSourceKind' |
  'projects' |
  'csvMapping'

type CubeCreatorNamespace = Record<CubeCreatorClass | CubeCreatorProperty, NamedNode>

export const cube = namespace('http://ns.bergnet.org/cube/')
export const cc: CubeCreatorNamespace = namespace('https://cube-creator.zazuko.com/vocab#') as any
