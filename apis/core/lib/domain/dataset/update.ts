import { dcat, hydra, rdf, schema, _void } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { NotFoundError } from '../../errors'
import { ResourceStore } from '../../ResourceStore'
import { resourceStore } from '../resources'

interface AddMetaDataCommand {
  dataset: GraphPointer<NamedNode>
  resource: GraphPointer
  store?: ResourceStore

}

export async function update({
  dataset,
  resource,
  store = resourceStore(),
}: AddMetaDataCommand): Promise<GraphPointer> {
  const datasetResource = await store.get(dataset.term)

  if (!datasetResource) {
    throw new NotFoundError(dataset)
  }

  datasetResource.out().forEach(child => {
    if (child.term.termType === 'BlankNode') {
      child.deleteOut()
    }
  })
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
