import { Constructor, property, RdfResource } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import type { Collection } from '@rdfine/hydra'
import type * as Rdfs from '@rdfine/rdfs'
import { ResourceMixin } from '@rdfine/rdfs'
import { Action, ActionMixin } from '@rdfine/schema'
import { cc } from '@cube-creator/core/namespace'
import { TableCollection } from './Table'
import { Link } from './lib/Link'
import { NamedNode } from 'rdf-js'
import { schema, dcterms, rdfs } from '@tpluscode/rdf-ns-builders'
import { initializer } from './lib/initializer'

export interface Job extends Action, Rdfs.Resource, RdfResource {
  created: Date
  link?: string
}

export interface TransformJob extends Job {
  cubeGraph: NamedNode
  tableCollection: Link<TableCollection>
  label: string
}

export interface PublishJob extends Job {
  project: NamedNode
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JobCollection extends Collection<Job> {

}

export function JobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<Job> {
    @property.literal({ path: dcterms.created, type: Date, initial: () => new Date() })
    created!: Date

    @property.literal({ path: rdfs.seeAlso })
    link?: string
  }

  return Impl
}

JobMixin.appliesTo = cc.Job

export function TransformJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<TransformJob> {
    @property.resource({ path: cc.tables })
    tableCollection!: Link<TableCollection>

    @property({ path: cc.cubeGraph })
    cubeGraph!: NamedNode

    @property.literal({ path: schema.name })
    label!: string

    @property.literal({ path: dcterms.created, type: Date, initial: () => new Date() })
    created!: Date
  }

  return Impl
}

TransformJobMixin.appliesTo = cc.TransformJob

type RequiredProperties = 'label' | 'cubeGraph' | 'tableCollection'

export const createTransform = initializer<TransformJob, RequiredProperties>(TransformJobMixin, {
  types: [cc.Job, cc.TransformJob],
  actionStatus: schema.PotentialActionStatus,
})

export function PublishJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends base implements Partial<PublishJob> {
    @property({ path: cc.project })
    project!: NamedNode
  }

  return Impl
}

PublishJobMixin.appliesTo = cc.PublishJob
