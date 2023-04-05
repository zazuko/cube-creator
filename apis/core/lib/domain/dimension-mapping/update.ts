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

interface Updated {
  dimensionMapping: GraphPointer
  hasChanges: boolean
}

export async function update({
  resource,
  mappings,
  store,
}: UpdateDimensionMapping): Promise<Updated> {
  const dimensionMappings = await store.getResource<Dictionary>(resource)
  const newMappings = fromPointer(mappings)

  const sharedDimensions = newMappings.sharedDimensions
  const dimension = newMappings.about

  if (!dimension || !dimension.equals(dimensionMappings.about)) {
    throw new error.BadRequest('Unexpected value of schema:about')
  }

  dimensionMappings.changeSharedDimensions(sharedDimensions)

  dimensionMappings.onlyValidTerms = newMappings.onlyValidTerms
  const entriesChanged = dimensionMappings.replaceEntries(newMappings.hadDictionaryMember)

  return {
    dimensionMapping: dimensionMappings.pointer,
    hasChanges: entriesChanged,
  }
}
