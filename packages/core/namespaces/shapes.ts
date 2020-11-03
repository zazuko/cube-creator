import namespace from '@rdf-esm/namespace'
import { NamedNode } from 'rdf-js'
import env from '../env'

export const baseUri = env.maybe.API_CORE_BASE || ''

type ShapeTerms =
  'cube-project/create' | 'cube-project/create#CSV' | 'cube-project/create#ExistingCube' | 'table/create' | 'dataset/edit-metadata'

type ShapesNamespace = (term: ShapeTerms) => NamedNode

export const shape: ShapesNamespace = namespace(baseUri + 'shape/') as any
