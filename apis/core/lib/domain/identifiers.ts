import UrlSlugify from 'url-slugify'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import env from '../env'

const url = new UrlSlugify()

export function cubeProject(label: string): NamedNode {
  return $rdf.namedNode(`${env.API_CORE_BASE}cube-project/${url.slugify(label)}`)
}

export function csvMapping(project: GraphPointer<NamedNode>): NamedNode {
  return $rdf.namedNode(`${project.value}/csv-mapping`)
}

export function csvSourceCollection(csvMapping: GraphPointer<NamedNode>): NamedNode {
  return $rdf.namedNode(`${csvMapping.value}/sources`)
}

export function csvSource(project: GraphPointer<NamedNode>, fileName: string): NamedNode {
  return $rdf.namedNode(`${project.value}/csv-source/${url.slugify(fileName)}`)
}

export function dialect(csvSource: GraphPointer<NamedNode>): NamedNode {
  return $rdf.namedNode(`${csvSource}/dialect`)
}

export function column(csvSource: GraphPointer<NamedNode>, columnName: string): NamedNode {
  return $rdf.namedNode(`${csvSource}/column/${url.slugify(columnName)}`)
}

export function user(user: string): NamedNode {
  return $rdf.namedNode(`${env.API_CORE_BASE}user/${user}`)
}
