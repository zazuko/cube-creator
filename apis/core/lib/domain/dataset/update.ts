import { cc } from '@cube-creator/core/namespace'
import { dcat, hydra, rdf, schema, _void } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { DatasetCore, NamedNode, Term } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
import { ResourceStore } from '../../ResourceStore'

interface AddMetaDataCommand {
  dataset: GraphPointer<NamedNode>
  resource: GraphPointer
  store: ResourceStore
}

/**
 * Copies quads of given subject and its blank node children
 */
function copySubgraph({ from, to, subject, alreadyAdded = new TermSet() }: { from: DatasetCore; to: DatasetCore; subject: Term; alreadyAdded?: TermSet }) {
  if (alreadyAdded.has(subject)) {
    return
  }
  alreadyAdded.add(subject)

  for (const quad of from.match(subject)) {
    to.add(quad)
    if (quad.object.termType === 'BlankNode') {
      copySubgraph({ from, to, alreadyAdded, subject: quad.object })
    }
  }
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

  copySubgraph({
    from: resource.dataset,
    to: datasetResource.dataset,
    subject: datasetResource.term,
  })

  // Make sure the type is correct
  datasetResource.addOut(rdf.type, hydra.Resource)
    .addOut(rdf.type, schema.Dataset)
    .addOut(rdf.type, _void.Dataset)
    .addOut(rdf.type, dcat.Dataset)

  hasPart.forEach(child => datasetResource.addOut(schema.hasPart, child))
  dimensionMetadata.forEach(child => datasetResource.addOut(cc.dimensionMetadata, child))

  return datasetResource
}
