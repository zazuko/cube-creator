import { namedNode } from '@rdf-esm/data-model'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

export const childResource = (segment: string) => (parent: RdfResourceCore) => namedNode(`${parent.id.value}/${segment}`)
