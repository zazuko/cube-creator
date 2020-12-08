import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { Job, JobMixin, Project, PublishJob } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NotFoundError } from '../../errors'
import { schema } from '@tpluscode/rdf-ns-builders'
import { cc } from '@cube-creator/core/namespace'

interface JobUpdateParams {
  resource: GraphPointer<NamedNode>
  store?: ResourceStore
}

function isPublishJob(job: Job): job is PublishJob {
  return job.types.has(cc.PublishJob)
}

export async function update({ resource, store = resourceStore() }: JobUpdateParams): Promise<GraphPointer> {
  const changes = RdfResource.factory.createEntity<Job>(resource, [JobMixin])
  const job = await store.getResource<Job>(resource.term)
  if (!job) {
    throw new NotFoundError(resource.term)
  }

  if (changes.actionStatus) {
    job.actionStatus = changes.actionStatus

    if (changes.actionStatus.equals(schema.CompletedActionStatus) && isPublishJob(job)) {
      const project = await store.getResource<Project>(job.project)
      project?.incrementPublishedRevision()
    }
  }

  if (changes.seeAlso.length) {
    job.seeAlso = changes.seeAlso
  }

  if (changes.error) {
    job.error = {
      ...changes.error.toJSON(),
      types: [schema.Thing],
    } as any
  } else {
    job.error?.pointer.deleteOut()
    job.error = undefined
  }

  await store.save()
  return job.pointer
}
