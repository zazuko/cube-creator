import { namedNode } from '@rdf-esm/data-model'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'

export const childResource = (segment: string) => (project: RdfResourceCore) => namedNode(`${project.id.value}/${segment}`)
