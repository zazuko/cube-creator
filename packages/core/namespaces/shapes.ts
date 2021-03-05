import namespace from '@rdf-esm/namespace'
import { NamedNode } from 'rdf-js'
import env from '../env'

export const baseUri = env.maybe.API_CORE_BASE || ''

type ShapeTerms =
  'cube-project/create' |
  'cube-project/create#CSV' |
  'cube-project/create#ExistingCube' |
  'cube-project/update' |
  'table/create' |
  'table/update' |
  'csv-source/update' |
  'dataset/edit-metadata' |
  'job/update' |
  'job/trigger' |
  'column-mapping/literal' |
  'column-mapping/reference' |
  'dimension/metadata' |
  'dimension/shared-mapping'

type ShapesNamespace = (term: ShapeTerms) => NamedNode

export const shape: ShapesNamespace = namespace(baseUri + 'shape/') as any
