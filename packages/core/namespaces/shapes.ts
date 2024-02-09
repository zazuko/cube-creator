import type { NamedNode } from '@rdfjs/types'
import namespace from '@rdf-esm/namespace'
import env from '../env'

export const baseUri = env.maybe.API_CORE_BASE || ''

type ShapeTerms =
  'cube-project/create' |
  'cube-project/update' |
  'cube-project/search' |
  'table/create' |
  'table/update' |
  'csv-source/create' |
  'csv-source/update' |
  'dataset/edit-metadata' |
  'job/update' |
  'job/trigger' |
  'column-mapping/literal' |
  'column-mapping/reference' |
  'dimension/metadata' |
  'dimension/metadata#coreGroup' |
  'dimension/metadata#hierarchyGroup' |
  'dimension/shared-mapping' |
  'dimension/shared-mapping-import' |
  'csv-source/s3Bucket'

type ShapesNamespace = (term: ShapeTerms) => NamedNode

export const shape: ShapesNamespace = namespace(baseUri + 'shape/') as any
