import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { Job, JobMixin, ImportProject, Dataset, CsvProject } from '@cube-creator/model'
import { isPublishJob, isTransformJob, JobErrorMixin } from '@cube-creator/model/Job'
import RdfResource from '@tpluscode/rdfine'
import { ResourceStore } from '../../ResourceStore'
import { schema } from '@tpluscode/rdf-ns-builders'
import { insertDimensionCardinalityError, insertMissingDimensionsError } from '../errors'
import { error } from '../../log'

interface JobUpdateParams {
  resource: GraphPointer<NamedNode>
  store: ResourceStore
}

export async function update({ resource, store }: JobUpdateParams): Promise<GraphPointer> {
  const changes = RdfResource.factory.createEntity<Job>(resource, [JobMixin])
  const job = await store.getResource<Job>(resource.term)

  job.modified = changes.modified
  job.comments = changes.comments

  if (changes.actionStatus) {
    job.actionStatus = changes.actionStatus

    if (changes.actionStatus.equals(schema.CompletedActionStatus)) {
      if (isPublishJob(job)) {
        const project = await store.getResource<CsvProject | ImportProject>(job.project)
        project.incrementPublishedRevision()

        const dataset = await store.getResource<Dataset>(project.dataset.id)
        if (job.revision === 1) {
          dataset.setPublishedDate(job.modified)
        }
      } else if (isTransformJob(job)) {
        await Promise.all([
          insertMissingDimensionsError(job).catch(error),
          insertDimensionCardinalityError(job).catch(error),
        ])
      }
    }
  }

  if (changes.seeAlso.length) {
    job.seeAlso = changes.seeAlso
  }

  if (changes.error) {
    job.error = RdfResource.factory.createEntity(job.pointer.blankNode(), [JobErrorMixin], {
      initializer: {
        ...changes.error.toJSON(),
        types: [schema.Thing],
      },
    }) as any
  } else {
    job.error?.pointer.deleteOut()
    job.error = undefined
  }

  return job.pointer
}
