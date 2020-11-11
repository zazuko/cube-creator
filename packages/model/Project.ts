import * as Rdfs from '@rdfine/rdfs'
import { CsvMapping, CsvMappingMixin } from './CsvMapping'
import { Constructor, namespace, property } from '@tpluscode/rdfine'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { cc } from '@cube-creator/core/namespace'
import { NamedNode } from 'rdf-js'
import { dcterms } from '@tpluscode/rdf-ns-builders'
import { initializer } from './lib/initializer'
import { childResource } from './lib/resourceIdentifiers'
import { Link } from './lib/Link'
import { Collection } from '@rdfine/hydra'
import { Job } from './Job'

export interface Project extends RdfResourceCore {
  csvMapping?: CsvMapping
  dataset: NamedNode
  cubeGraph: NamedNode
  creator: NamedNode
  label: string
  jobCollection: Link<Collection<Job>>
}

export function ProjectMixin<Base extends Constructor>(base: Base) {
  @namespace(cc as any)
  class Impl extends Rdfs.ResourceMixin(base) implements Partial<Project> {
    @property.resource({ as: [CsvMappingMixin] })
    csvMapping?: CsvMapping

    @property({ initial: childResource('dataset') })
    dataset!: NamedNode

    @property({ initial: childResource('cube-data') })
    cubeGraph!: NamedNode

    @property({ path: dcterms.creator })
    creator!: NamedNode

    @property.resource({ path: cc.jobCollection })
    jobCollection!: Link<Collection<Job>>
  }

  return Impl
}

ProjectMixin.appliesTo = cc.CubeProject

type MandatoryFields = 'creator' | 'label'

export const create = initializer<Project, MandatoryFields>(ProjectMixin)
