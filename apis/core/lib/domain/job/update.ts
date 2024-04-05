import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import { Job, JobMixin, ImportProject, Dataset, CsvProject } from '@cube-creator/model'
import { isPublishJob, isTransformJob, JobErrorMixin } from '@cube-creator/model/Job'
import $rdf from '@cube-creator/env'
import { schema } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../../ResourceStore.js'
import { insertDimensionCardinalityError, insertMissingDimensionsError } from '../errors/index.js'
import { error } from '../../log.js'
import { clearDimensionChangedWarning } from '../dimension/update.js'

interface JobUpdateParams {
  resource: GraphPointer<NamedNode>
  store: ResourceStore
}

export async function update({ resource, store }: JobUpdateParams): Promise<GraphPointer> {
  const changes = $rdf.rdfine().factory.createEntity<Job>(resource, [JobMixin])
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
          clearDimensionChangedWarning({ id: job.dimensionMetadata.id, store }).catch(error),
        ])
      }
    }
  }

  if (changes.seeAlso.length) {
    job.seeAlso = changes.seeAlso
  }

  if (changes.error) {
    job.error = $rdf.rdfine().factory.createEntity(job.pointer.blankNode(), [JobErrorMixin], {
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
