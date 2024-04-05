import $rdf from '@zazuko/env'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { shape } from '../lib/namespace.js'

const SharedDimensionCreate = $rdf.clownface()
  .namedNode(shape('shape/shared-dimension-create'))
  .addOut(rdf.type, sh.NodeShape)

const SharedDimensionUpdate = $rdf.clownface()
  .namedNode(shape('shape/shared-dimension-update'))
  .addOut(rdf.type, sh.NodeShape)

const SharedDimensionTermCreate = $rdf.clownface()
  .namedNode(shape('shape/shared-dimension-term-create'))
  .addOut(rdf.type, sh.NodeShape)

const SharedDimensionTermUpdate = $rdf.clownface()
  .namedNode(shape('shape/shared-dimension-term-update'))
  .addOut(rdf.type, sh.NodeShape)

const Hierarchy = $rdf.clownface()
  .namedNode(shape('shape/hierarchy'))
  .addOut(rdf.type, sh.NodeShape)

const HierarchyCreate = $rdf.clownface()
  .namedNode(shape('shape/hierarchy-create'))
  .addOut(rdf.type, sh.NodeShape)

export default [
  SharedDimensionCreate,
  SharedDimensionUpdate,
  SharedDimensionTermCreate,
  SharedDimensionTermUpdate,
  Hierarchy,
  HierarchyCreate,
]
