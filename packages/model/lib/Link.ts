import { RdfResource, RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import { DatasetCore } from 'rdf-js'
import { HydraResponse } from 'alcaeus'

export type Link<T extends RdfResourceCore> = RdfResourceCore & Partial<RdfResource> & {
  load?(): Promise<HydraResponse<DatasetCore, T>>
}
