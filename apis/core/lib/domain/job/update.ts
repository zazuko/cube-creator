import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { Job, JobMixin } from '@cube-creator/model'
import RdfResource from '@tpluscode/rdfine'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'
import { NotFoundError } from '../../errors'

interface JobUpdateParams {
  resource: GraphPointer<NamedNode>
  store?: ResourceStore
}

export async function update({ resource, store = resourceStore() }: JobUpdateParams): Promise<GraphPointer> {
  const changes = RdfResource.factory.createEntity<Job>(resource, [JobMixin])
  const job = await store.getResource<Job>(resource.term)
  if (!job) {
    throw new NotFoundError(resource.term)
  }

  if (changes.actionStatus) {
    job.actionStatus = changes.actionStatus
  }

  if (changes.seeAlso) {
    job.seeAlso = changes.seeAlso
  }

  await store.save()
  return job.pointer
}
