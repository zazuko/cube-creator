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

  for (const quad of datasetResource.dataset) {
    datasetResource.dataset.delete(quad)
  }
  for (const quad of resource.dataset) {
    datasetResource.dataset.add(quad)
  }

  // Make sure the type is correct
  datasetResource.addOut(rdf.type, hydra.Resource)
    .addOut(rdf.type, schema.Dataset)
    .addOut(rdf.type, _void.Dataset)
    .addOut(rdf.type, dcat.Dataset)

  datasetResource.deleteOut(schema.hasPart).addOut(schema.hasPart, hasPart.terms)
  datasetResource.deleteOut(cc.dimensionMetadata).addOut(cc.dimensionMetadata, dimensionMetadata.terms)

  return datasetResource
}
