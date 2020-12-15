import { cc } from '@cube-creator/core/namespace'
import { dcat, hydra, rdf, schema, _void } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import { ResourceStore } from '../../ResourceStore'

interface AddMetaDataCommand {
  dataset: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore

}

export async function update({
  dataset,
  resource,
  store,
}: AddMetaDataCommand): Promise<GraphPointer> {
  const datasetResource = await store.get(dataset.term)

  const hasPart = datasetResource.out(schema.hasPart)
  const dimensionMetadata = datasetResource.out(cc.dimensionMetadata)

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

  hasPart.forEach(child => datasetResource.addOut(schema.hasPart, child))
  dimensionMetadata.forEach(child => datasetResource.addOut(cc.dimensionMetadata, child))

  return datasetResource
}
