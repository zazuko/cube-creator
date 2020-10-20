import * as Rdfs from '@rdfine/rdfs'
import { CsvMapping, CsvMappingMixin } from './CsvMapping'
import { Constructor, property, RdfResource } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'

export interface Project extends Rdfs.Resource {
  csvMapping?: CsvMapping
}

export function ProjectMixin<Base extends Constructor<RdfResource>>(base: Base) {
  class Impl extends Rdfs.ResourceMixin(base) implements Project {
    @property.resource({ path: cc.csvMapping, as: [CsvMappingMixin] })
    csvMapping?: CsvMapping
  }

  return Impl
}

ProjectMixin.appliesTo = cc.CubeProject
