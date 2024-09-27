import type { Literal, NamedNode, Term } from '@rdfjs/types'
import { Constructor, property, RdfResource } from '@tpluscode/rdfine'
import { Mixin } from '@tpluscode/rdfine/lib/ResourceFactory'
import type { Collection } from '@rdfine/hydra'
import type * as Rdfs from '@rdfine/rdfs'
import { ResourceMixin } from '@rdfine/rdfs'
import { Action, ActionMixin, CreativeWork, CreativeWorkMixin, Thing, ThingMixin } from '@rdfine/schema'
import { ValidationReport, ValidationReportMixin } from '@rdfine/shacl'
import { cc } from '@cube-creator/core/namespace'
import { schema, dcterms, rdfs, rdf } from '@tpluscode/rdf-ns-builders'
import { TableCollection } from './Table'
import { Link } from './lib/Link'
import { initializer } from './lib/initializer'
import { DimensionMetadataCollection } from './DimensionMetadata'

export interface JobError extends Thing {
  validationReport?: ValidationReport
}

export interface Job extends Action, Rdfs.Resource, RdfResource {
  created: Date
  modified: Date
  link?: RdfResource
  name: string
  comments: string[]
  error: JobError | undefined
}

export interface TransformJob extends Job {
  project: NamedNode
  cubeGraph: NamedNode
  tableCollection: Link<TableCollection>
  dimensionMetadata: Link<DimensionMetadataCollection>
}

export interface PublishJob extends Job {
  project: NamedNode
  revision: number
  publishGraph: NamedNode
  publishedTo: Term[]
  status?: Term
  query?: string
  workExamples: CreativeWork[]
  addWorkExample(attrs: any): void
}

export interface UnlistJob extends Job {
  project: NamedNode
  publishGraph: NamedNode
}

export function isPublishJob(job: Job): job is PublishJob {
  return job.types.has(cc.PublishJob)
}

export function isTransformJob(job: Job): job is TransformJob {
  return job.types.has(cc.TransformJob)
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface JobCollection extends Collection<Job> {

}

export function JobErrorMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ThingMixin(base)) implements Partial<JobError> {
    @property.resource({ path: cc.validationReport, as: [ValidationReportMixin] })
    validationReport?: ValidationReport
  }

  return Impl
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

    @property.literal({ path: rdfs.comment, values: 'array' })
    comments!: string[]
  }

  return Impl
}

JobMixin.appliesTo = cc.Job

export function TransformJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<TransformJob> {
    @property({ path: cc.project })
    project!: NamedNode

    @property.resource({ path: cc.tables })
    tableCollection!: Link<TableCollection>

    @property({ path: cc.cubeGraph })
    cubeGraph!: NamedNode

    @property.resource({ path: cc.dimensionMetadata })
    dimensionMetadata!: Link<DimensionMetadataCollection>
  }

  return Impl
}

TransformJobMixin.appliesTo = cc.TransformJob

type RequiredProperties = 'name' | 'cubeGraph' | 'tableCollection' | 'dimensionMetadata'

export const createTransform = initializer<TransformJob, RequiredProperties>(TransformJobMixin, {
  types: [cc.Job, cc.TransformJob],
  actionStatus: schema.PotentialActionStatus,
})

export interface WorkExampleInput {
  name: Literal[]
  url: NamedNode
  encodingFormat: Literal
}

export function PublishJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<PublishJob> {
    @property({ path: cc.project })
    project!: NamedNode

    @property.literal({ path: cc.revision, type: Number })
    revision!: number

    @property({ path: cc.publishGraph })
    publishGraph!: NamedNode

    @property({ path: schema.creativeWorkStatus })
    status?: NamedNode

    get publishedTo(): Term[] {
      return this.pointer
        .out(schema.workExample)
        .filter(example => example.out(schema.encodingFormat).terms.length === 0)
        .terms
    }

    set publishedTo(terms: Term[]) {
      terms.forEach(term => {
        this.pointer.addOut(schema.workExample, term)
      })
    }

    get workExamples(): CreativeWork[] {
      return this.pointer
        .out(schema.workExample)
        .filter(example => example.out(schema.encodingFormat).terms.length > 0)
        .map(workExampleP => new CreativeWorkMixin.Class(workExampleP as any) as CreativeWork)
    }

    addWorkExample(attrs: WorkExampleInput) {
      return this.pointer.addOut(schema.workExample, workExample => {
        workExample
          .addOut(rdf.type, schema.CreativeWork)
          .addOut(schema.name, attrs.name)
          .addOut(schema.url, attrs.url)
          .addOut(schema.encodingFormat, attrs.encodingFormat)
      })
    }

    // Legacy. Kept to support old data.
    @property.literal({ path: schema.query })
    query?: string
  }

  return Impl
}

PublishJobMixin.appliesTo = cc.PublishJob

type RequiredPropertiesPublish = 'name' | 'project' | 'revision' | 'publishGraph'

export const createPublish = initializer<PublishJob, RequiredPropertiesPublish>(PublishJobMixin, {
  types: [cc.Job, cc.PublishJob],
  actionStatus: schema.PotentialActionStatus,
})

export function UnlistJobMixin<Base extends Constructor<RdfResource>>(base: Base): Mixin {
  class Impl extends ResourceMixin(ActionMixin(base)) implements Partial<UnlistJob> {
    @property({ path: cc.project })
    project!: NamedNode

    @property({ path: cc.publishGraph })
    publishGraph!: NamedNode
  }

  return Impl
}

UnlistJobMixin.appliesTo = cc.UnlistJob

type RequiredPropertiesUnlist = 'name' | 'project' | 'publishGraph'

export const createUnlist = initializer<UnlistJob, RequiredPropertiesUnlist>(UnlistJobMixin, {
  types: [cc.Job, cc.UnlistJob],
  actionStatus: schema.PotentialActionStatus,
})
