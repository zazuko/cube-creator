import clownface from 'clownface'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'
import { shape } from '../lib/namespace'

const ManagedDimension = clownface({ dataset: $rdf.dataset() })
  .namedNode(shape('shape/managed-dimension'))
  .addOut(rdf.type, sh.NodeShape)

const ManagedDimensionTermCreate = clownface({ dataset: $rdf.dataset() })
  .namedNode(shape('shape/managed-dimension-term-create'))
  .addOut(rdf.type, sh.NodeShape)

const ManagedDimensionTermUpdate = clownface({ dataset: $rdf.dataset() })
  .namedNode(shape('shape/managed-dimension-term-update'))
  .addOut(rdf.type, sh.NodeShape)

export default [
  ManagedDimension,
  ManagedDimensionTermCreate,
  ManagedDimensionTermUpdate,
]
