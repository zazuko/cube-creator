import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { shape } from '../lib/namespace'

const SharedDimension = clownface({ dataset: $rdf.dataset() })
  .namedNode(shape('shape/shared-dimension'))
  .addOut(rdf.type, sh.NodeShape)

const SharedDimensionTermCreate = clownface({ dataset: $rdf.dataset() })
  .namedNode(shape('shape/shared-dimension-term-create'))
  .addOut(rdf.type, sh.NodeShape)

const SharedDimensionTermUpdate = clownface({ dataset: $rdf.dataset() })
  .namedNode(shape('shape/shared-dimension-term-update'))
  .addOut(rdf.type, sh.NodeShape)

export default [
  SharedDimension,
  SharedDimensionTermCreate,
  SharedDimensionTermUpdate,
]
