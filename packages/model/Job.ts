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
  modified: Date
  link?: RdfResource
  name: string
}

export interface TransformJob extends Job {
  cubeGraph: NamedNode
  tableCollection: Link<TableCollection>
}

export interface PublishJob extends Job {
  project: NamedNode
  revision: number
  publishGraph: NamedNode
}

export function isPublishJob(job: Job): job is PublishJob {
  return job.types.has(cc.PublishJob)
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JobCollection extends Collection<Job> {

}

export function JobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<Job> {
    @property.literal({ path: dcterms.created, type: Date, initial: () => new Date() })
    created!: Date

    @property.literal({ path: dcterms.modified, type: Date })
    modified!: Date

    @property.literal({ path: schema.name })
    name!: string

    @property.resource({ path: rdfs.seeAlso })
    link?: RdfResource
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
  }

  return Impl
}

TransformJobMixin.appliesTo = cc.TransformJob

type RequiredProperties = 'name' | 'cubeGraph' | 'tableCollection'

export const createTransform = initializer<TransformJob, RequiredProperties>(TransformJobMixin, {
  types: [cc.Job, cc.TransformJob],
  actionStatus: schema.PotentialActionStatus,
})

export function PublishJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<PublishJob> {
    @property({ path: cc.project })
    project!: NamedNode

    @property.literal({ path: cc.revision, type: Number })
    revision!: number

    @property({ path: cc.publishGraph })
    publishGraph!: NamedNode
  }

  return Impl
}

PublishJobMixin.appliesTo = cc.PublishJob

type RequiredPropertiesPublish = 'name' | 'project' | 'revision' | 'publishGraph'

export const createPublish = initializer<PublishJob, RequiredPropertiesPublish>(PublishJobMixin, {
  types: [cc.Job, cc.PublishJob],
  actionStatus: schema.PotentialActionStatus,
})
