import { NamedNode } from 'rdf-js'
import TermMap from '@rdfjs/term-map'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import * as sharedDimension from './shared-dimension'
import type { Initializer } from '@tpluscode/rdfine/RdfResource'
import type { NodeShape } from '@rdfine/shacl'
import RdfResource from '@tpluscode/rdfine'
import { NodeShapeBundle, PropertyShapeBundle } from '@rdfine/shacl/bundles'
import { ResourceBundle } from '@rdfine/rdfs/bundles'
import { fromPointer } from '@rdfine/shacl/lib/NodeShape'
import { shape } from '../namespace'
import * as dimensionTerm from './shared-dimension-term'
import { loadDynamicTermProperties } from './dynamic-properties'
import { Request } from 'express'
import parsePreferHeader from 'parse-prefer-header'

RdfResource.factory.addMixin(...NodeShapeBundle)
RdfResource.factory.addMixin(...PropertyShapeBundle)
RdfResource.factory.addMixin(...ResourceBundle)

interface ShapeFactory {
  (req: Request): Promise<GraphPointer<NamedNode>>
}

function entry(id: NamedNode, init: () => Initializer<NodeShape>): [NamedNode, ShapeFactory] {
  async function factory(req: Request) {
    const pointer = clownface({ dataset: $rdf.dataset() }).namedNode(id)
    fromPointer(pointer, init())

    const { targetClass } = parsePreferHeader(req.header('Prefer'))
    for (const quad of await loadDynamicTermProperties(targetClass, pointer)) {
      pointer.dataset.add(quad)
    }

    return pointer
  }

  return [
    id, factory,
  ]
}

export default new TermMap<NamedNode, ShapeFactory>([
  entry(shape['shape/shared-dimension-create'], sharedDimension.create),
  entry(shape['shape/shared-dimension-update'], sharedDimension.update),
  entry(shape['shape/shared-dimension-term-create'], dimensionTerm.create),
  entry(shape['shape/shared-dimension-term-update'], dimensionTerm.update),
])
