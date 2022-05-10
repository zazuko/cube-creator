import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import error from 'http-errors'
import { Dictionary } from '@rdfine/prov'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import { ResourceStore } from '../../ResourceStore'

interface UpdateDimensionMapping {
  resource: NamedNode
  mappings: GraphPointer<NamedNode>
  store: ResourceStore
}

export async function update({
  resource,
  mappings,
  store,
}: UpdateDimensionMapping): Promise<GraphPointer> {
  const dimensionMappings = await store.getResource<Dictionary>(resource)
  const newMappings = fromPointer(mappings)

  const sharedDimensions = newMappings.sharedDimensions
  const dimension = newMappings.about

  if (!dimension || !dimension.equals(dimensionMappings.about)) {
    throw new error.BadRequest('Unexpected value of schema:about')
  }

  dimensionMappings.changeSharedDimensions(sharedDimensions)

  dimensionMappings.onlyValidTerms = newMappings.onlyValidTerms
  dimensionMappings.replaceEntries(newMappings.hadDictionaryMember)

  return dimensionMappings.pointer
}
