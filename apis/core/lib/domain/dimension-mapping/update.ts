import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import error from 'http-errors'
import { ResourceStore } from '../../ResourceStore'
import { replaceValueWithDefinedTerms } from '../queries/dimension-mappings'
import { Dictionary } from '@rdfine/prov'
import { fromPointer } from '@rdfine/prov/lib/Dictionary'
import * as log from '../../log'
import { cc } from '@cube-creator/core/namespace'

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

  const managedDimension = newMappings.managedDimension
  const dimension = newMappings.about

  if (!dimension || !dimension.equals(dimensionMappings.about)) {
    throw new error.BadRequest('Unexpected value of schema:about')
  }

  if (!managedDimension || !managedDimension.equals(dimensionMappings.managedDimension)) {
    dimensionMappings.changeManageDimension(managedDimension)
  }

  const newEntries = dimensionMappings.replaceEntries(newMappings.hadDictionaryMember)

  const { applyMappings } = cc
  if (newEntries.size && mappings.out(applyMappings).value === 'true') {
    replaceValueWithDefinedTerms({ dimensionMapping: resource, terms: newEntries })
      .catch((err: Error) => log.error(`Failed to update observations: ${err.message}`))
  }

  return dimensionMappings.pointer
}
