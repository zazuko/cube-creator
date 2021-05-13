import { NamedNode } from 'rdf-js'
import { Constructor, namespace, property, RdfResource } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import { ResourceMixin } from '@rdfine/rdfs'
import { ActionMixin } from '@rdfine/schema'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'
import { initializer } from './lib/initializer'
import { Job } from './Job'

export interface ImportJob extends Job {
  sourceCube: NamedNode
  sourceGraph?: NamedNode
  sourceEndpoint: NamedNode
  cubeGraph: NamedNode
  dimensionMetadata: NamedNode
}

export function ImportJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  @namespace(cc)
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<ImportJob> {
    @property({ path: cc['CubeProject/sourceCube'] })
    sourceCube!: NamedNode

    @property({ path: cc['CubeProject/sourceEndpoint'] })
    sourceEndpoint!: NamedNode

    @property({ path: cc['CubeProject/sourceGraph'] })
    sourceGraph?: NamedNode

    @property()
    cubeGraph!: NamedNode

    @property()
    dimensionMetadata!: NamedNode
  }

  return Impl
}

ImportJobMixin.appliesTo = cc.ImportJob

type RequiredProperties = 'name' | 'sourceCube' | 'sourceEndpoint' | 'cubeGraph'

export const create = initializer<ImportJob, RequiredProperties>(ImportJobMixin, {
  types: [cc.Job, cc.ImportJob],
  actionStatus: schema.PotentialActionStatus,
})
