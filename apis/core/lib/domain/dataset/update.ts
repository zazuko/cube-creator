import { dcat, hydra, rdf, schema, _void } from '@tpluscode/rdf-ns-builders'
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

  datasetResource.deleteOut()

  datasetResource.dataset.addAll([...resource.dataset])

  // Make sure the type is correct
  datasetResource.addOut(rdf.type, hydra.Resource)
    .addOut(rdf.type, schema.Dataset)
    .addOut(rdf.type, _void.Dataset)
    .addOut(rdf.type, dcat.Dataset)

  await store.save()

  return datasetResource
}
