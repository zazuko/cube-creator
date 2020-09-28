import UrlSlugify from 'url-slugify'
import $rdf from 'rdf-ext'
import { NamedNode } from 'rdf-js'
import env from '../env'

const url = new UrlSlugify()

export function cubeProject(label: string): NamedNode {
  return $rdf.namedNode(`${env.API_CORE_BASE}cube-project/${url.slugify(label)}`)
}

export function csvMapping(filename: string): NamedNode {
  return $rdf.namedNode(`${env.API_CORE_BASE}csv-mapping/${url.slugify(filename)}`)
}
