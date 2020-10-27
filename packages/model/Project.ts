import * as Rdfs from '@rdfine/rdfs'
import { CsvMapping, CsvMappingMixin } from './CsvMapping'
import { Constructor, namespace, property, RdfResource } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { NamedNode } from 'rdf-js'

export interface Project extends Rdfs.Resource {
  csvMapping?: CsvMapping
  cubeGraph?: NamedNode
}

export function ProjectMixin<Base extends Constructor<RdfResource>>(base: Base) {
  @namespace(cc as any)
  class Impl extends Rdfs.ResourceMixin(base) implements Project {
    @property.resource({ as: [CsvMappingMixin] })
    csvMapping?: CsvMapping

    @property()
    cubeGraph?: NamedNode
  }

  return Impl
}

ProjectMixin.appliesTo = cc.CubeProject
