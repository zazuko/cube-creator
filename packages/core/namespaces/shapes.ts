import namespace from '@rdf-esm/namespace'
import { NamedNode } from 'rdf-js'
import { baseUri } from '../env'

type ShapeTerms =
  'cube-project/create' | 'cube-project/create#CSV' | 'cube-project/create#ExistingCube' | 'table/create'

type ShapesNamespace = (term: ShapeTerms) => NamedNode

export const shape: ShapesNamespace = namespace(baseUri + 'shape/') as any
