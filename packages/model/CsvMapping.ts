import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { CsvSource, SourcesCollection } from './CsvSource'
import { TableCollection } from './Table'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { NamedNode } from 'rdf-js'
import { Project } from './Project'

export interface CsvMapping extends RdfResource {
  namespace: NamedNode
  sources: CsvSource[]
  sourcesCollection: Link<SourcesCollection>
  tableCollection: Link<TableCollection>
  project: Link<Project>
}

export function CsvMappingMixin<Base extends Constructor>(base: Base) {
  class Impl extends base implements Partial<CsvMapping> {
    @property({ path: cc.namespace })
    namespace!: NamedNode

    @property.resource({ path: cc.csvSource, values: 'array' })
    sources!: CsvSource[]

    @property.resource({ path: cc.csvSourceCollection })
    sourcesCollection!: Link<SourcesCollection>

    @property.resource({ path: cc.tables })
    tableCollection!: Link<TableCollection>

    @property.resource({ path: cc.project })
    project!: Link<Project>
  }

  return Impl
}

CsvMappingMixin.appliesTo = cc.CsvMapping

type RequiredProperties = 'namespace' | 'project'

export const create = initializer<CsvMapping, RequiredProperties>(CsvMappingMixin)
