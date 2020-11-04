import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { NotFoundError } from '../../errors'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'

interface AddMetaDatatCommand {
  dataset: GraphPointer<NamedNode>
  resource: GraphPointer
  store?: ResourceStore

}

export async function update({
  dataset,
  resource,
  store = resourceStore(),
}: AddMetaDatatCommand): Promise<GraphPointer> {
  const datasetResource = await store.get(dataset.term)

  if (!datasetResource) {
    throw new NotFoundError(dataset)
  }

  if (dataset.value !== resource.value) {
    throw new Error(`Try to update resource ${dataset.term} with different ${resource.term}`)
  }

  datasetResource.deleteOut()

  datasetResource.dataset.addAll([...resource.dataset])

  await store.save()

  return datasetResource
}
