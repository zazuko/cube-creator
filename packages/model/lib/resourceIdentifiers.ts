import { NamedNode } from 'rdf-js'
import { namedNode } from '@rdf-esm/data-model'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

export const childResource = (segment: string) => (parent: RdfResourceCore): NamedNode => namedNode(`${parent.id.value}/${segment}`)
