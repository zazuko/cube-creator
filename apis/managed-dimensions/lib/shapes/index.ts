import { NamedNode } from 'rdf-js'
import TermMap from '@rdfjs/term-map'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import managedDimensionCreate from './managed-dimension-create'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { NodeShape } from '@rdfine/shacl'
import { fromPointer } from '@rdfine/shacl/lib/NodeShape'
import { shape } from '../namespace'

interface ShapeFactory {
  (): GraphPointer<NamedNode>
}

function entry(id: NamedNode, init: () => Initializer<NodeShape>): [NamedNode, ShapeFactory] {
  function factory() {
    const pointer = clownface({ dataset: $rdf.dataset() }).namedNode(id)
    fromPointer(pointer, init())
    return pointer
  }

  return [
    id, factory,
  ]
}

export default new TermMap<NamedNode, ShapeFactory>([
  entry(shape('shape/managed-dimension'), managedDimensionCreate),
])
