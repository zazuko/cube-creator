import clownface, { GraphPointer } from 'clownface'
import { NamedNode, Quad } from 'rdf-js'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { ResourceStore } from '../../ResourceStore'

interface UpdateDimensionCommand {
  metadataCollection: NamedNode
  dimensionMetadata: GraphPointer
  store: ResourceStore
}

function * extractSubgraph(pointer: GraphPointer, visited = new TermSet()): Iterable<Quad> {
  if (visited.has(pointer.term)) {
    return
  }

  for (const quad of pointer.dataset.match(pointer.term)) {
    yield quad

    if (quad.object.termType === 'BlankNode') {
      visited.add(quad.object)
      for (const child of extractSubgraph(pointer.node(quad.object))) {
        yield child
      }
    }
  }
}

export async function update({
  metadataCollection,
  store,
  dimensionMetadata,
}: UpdateDimensionCommand): Promise<GraphPointer> {
  const metadata = await store.getResource<DimensionMetadataCollection>(metadataCollection)

  metadata.updateDimension(dimensionMetadata)

  const dataset = $rdf.dataset([...extractSubgraph(metadata.pointer.node(dimensionMetadata.term))])
  return clownface({ dataset }).node(dimensionMetadata.term)
}
