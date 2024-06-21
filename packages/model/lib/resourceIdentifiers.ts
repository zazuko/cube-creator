import type { NamedNode } from '@rdfjs/types'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import $rdf from '@zazuko/env'

export const childResource = (segment: string) => (parent: RdfResourceCore): NamedNode => $rdf.namedNode(`${parent.id.value}/${segment}`)
