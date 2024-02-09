import type { NamedNode } from '@rdfjs/types'
import UrlSlugify from 'url-slugify'
import $rdf from 'rdf-ext'
import { GraphPointer } from 'clownface'
import env from '@cube-creator/core/env'
import { nanoid } from 'nanoid'
import { ColumnMapping, CsvMapping, CsvSource, Project, Table } from '@cube-creator/model'

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

export function table(csvMapping: CsvMapping, label: string): NamedNode {
  return $rdf.namedNode(`${csvMapping.id.value}/table/${url.slugify(label)}`)
}

export function columnMapping(table: Table, columnName: string): NamedNode {
  return $rdf.namedNode(`${table.id.value}/column-mapping/${url.slugify(columnName)}`)
}

export function identifierMapping(columnMapping: ColumnMapping): NamedNode {
  return $rdf.namedNode(`${columnMapping.id.value}/identifier-mapping/${nanoid()}`)
}

export function csvSource(mapping: CsvMapping, fileName: string): NamedNode {
  return $rdf.namedNode(`${mapping.id.value}/csv-source/${url.slugify(fileName)}`)
}

export function dialect(csvSource: GraphPointer<NamedNode>): NamedNode {
  return $rdf.namedNode(`${csvSource}/dialect`)
}

export function column(csvSource: CsvSource, columnName: string): NamedNode {
  return $rdf.namedNode(`${csvSource.id.value}/column/${url.slugify(columnName)}`)
}

export function user(user: string): NamedNode {
  return $rdf.namedNode(`${env.API_CORE_BASE}user/${user}`)
}

export function job(jobCollection: GraphPointer<NamedNode>): NamedNode {
  return $rdf.namedNode(`${jobCollection.value}/${nanoid()}`)
}

export function dimensionMapping(project: Project, dimensionSlug: string): NamedNode {
  return $rdf.namedNode(`${project.id.value}/dimension-mapping/${url.slugify(dimensionSlug)}`)
}
