import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { DatasetCore } from 'rdf-js'
import { HydraResponse } from 'alcaeus'

// eslint-disable-next-line no-use-before-define
export interface Link<T extends RdfResourceCore<D>, D extends DatasetCore = T extends RdfResourceCore<infer DT> ? DT : never> extends RdfResourceCore<D> {
  load?(): Promise<HydraResponse<D, T>>
}
