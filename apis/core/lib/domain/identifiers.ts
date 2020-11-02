import UrlSlugify from 'url-slugify'
import $rdf from 'rdf-ext'
import { NamedNode, Term } from 'rdf-js'
import { GraphPointer } from 'clownface'
import env from '@cube-creator/core/env'
import { CsvMapping, Project } from '@cube-creator/model'

const url = new UrlSlugify()

export function cubeProject(label: string): NamedNode {
  return $rdf.namedNode(`${env.API_CORE_BASE}cube-project/${url.slugify(label)}`)
}

export function csvMapping(project: Project): NamedNode {
  return $rdf.namedNode(`${project.id.value}/csv-mapping`)
}

export function csvSourceCollection(csvMapping: CsvMapping): NamedNode {
  return $rdf.namedNode(`${csvMapping.id.value}/sources`)
}

export function tableCollection(csvMapping: CsvMapping): NamedNode {
  return $rdf.namedNode(`${csvMapping.id.value}/tables`)
}

export function table(csvMapping: Term, label: string): NamedNode {
  return $rdf.namedNode(`${csvMapping.value}/table/${url.slugify(label)}`)
}

export function columnMapping(table: GraphPointer<NamedNode>, columnName: string): NamedNode {
  return $rdf.namedNode(`${table.value}/column-mapping/${url.slugify(columnName)}`)
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
