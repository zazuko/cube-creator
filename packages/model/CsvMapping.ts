import { RdfResource } from '@tpluscode/rdfine/RdfResource'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { Constructor, property } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { CsvSource, SourcesCollection } from './CsvSource'
import { TableCollection } from './Table'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { NamedNode, Term } from 'rdf-js'
import { Project } from './Project'

export interface CsvMapping extends RdfResource {
  sources: CsvSource[]
  sourcesCollection: Link<SourcesCollection>
  tableCollection: Link<TableCollection>
  project: Link<Project>
  createIdentifier(template: string | Term): NamedNode
}

export function CsvMappingMixin<Base extends Constructor>(base: Base): Mixin {
  class Impl extends base implements Partial<CsvMapping> {
    @property.resource({ path: cc.csvSource, values: 'array' })
    sources!: CsvSource[]

    @property.resource({ path: cc.csvSourceCollection })
    sourcesCollection!: Link<SourcesCollection>

    @property.resource({ path: cc.tables })
    tableCollection!: Link<TableCollection>

    @property.resource({ path: cc.project })
    project!: Link<Project>

    createIdentifier(template: string | Term): NamedNode {
      const namespace = this.namespace.value.match(/[/#]$/) ? this.namespace.value : `${this.namespace.value}/`

      if (typeof template === 'string') {
        return this.pointer.namedNode(namespace + template).term
      }

      if (template.termType === 'Literal') {
        return this.pointer.namedNode(namespace + template.value).term
      }
      if (template.termType === 'NamedNode') {
        return template
      }

      throw new Error(`Unexpected identifier template type ${template.termType}`)
    }
  }

  return Impl
}

CsvMappingMixin.appliesTo = cc.CsvMapping

type RequiredProperties = 'project'

export const create = initializer<CsvMapping, RequiredProperties>(CsvMappingMixin)
