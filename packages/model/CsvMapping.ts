import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { Constructor, property } from '@tpluscode/rdfine'
import { Collection } from '@rdfine/hydra'
import { cc } from '@cube-creator/core/namespace'
import { CsvSource } from './CsvSource'
import { Table } from './Table'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { NamedNode } from 'rdf-js'
import { Project } from './Project'

export interface CsvMapping extends RdfResourceCore {
  namespace: NamedNode
  sources: CsvSource[]
  sourcesCollection: Link<Collection<CsvSource>>
  tableCollection: Link<Collection<Table>>
  project: Link<Project>
}

export function CsvMappingMixin<Base extends Constructor>(base: Base) {
  class Impl extends base implements Partial<CsvMapping> {
    @property({ path: cc.namespace })
    namespace!: NamedNode

    @property.resource({ path: cc.csvSource, values: 'array' })
    sources!: CsvSource[]

    @property.resource({ path: cc.csvSourceCollection })
    sourcesCollection!: Link<Collection<CsvSource>>

    @property.resource({ path: cc.tables })
    tableCollection!: Link<Collection<Table>>

    @property.resource({ path: cc.project })
    project!: Link<Project>
  }

  return Impl
}

CsvMappingMixin.appliesTo = cc.CsvMapping

type RequiredProperties = 'namespace' | 'project'

export const create = initializer<CsvMapping, RequiredProperties>(CsvMappingMixin)
