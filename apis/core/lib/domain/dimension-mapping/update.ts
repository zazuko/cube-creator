import type { NamedNode } from '@rdfjs/types'
import type { GraphPointer } from 'clownface'
import error from 'http-errors'
import { Dictionary } from '@rdfine/prov'
import { cc, md } from '@cube-creator/core/namespace'
import { isNamedNode } from 'is-graph-pointer'
import { schema } from '@tpluscode/rdf-ns-builders'
import { ResourceStore } from '../../ResourceStore.js'

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

  const sharedDimensions = mappings.out(cc.sharedDimension).filter(isNamedNode).terms
  const dimension = mappings.out(schema.about).term!

  if (!dimension || !dimension.equals(dimensionMappings.about)) {
    throw new error.BadRequest('Unexpected value of schema:about')
  }

  dimensionMappings.changeSharedDimensions(sharedDimensions)

  dimensionMappings.onlyValidTerms = mappings.out(md.onlyValidTerms).value === 'true'
  const { entriesChanged } = dimensionMappings.replaceEntries(mappings)

  return {
    dimensionMapping: dimensionMappings.pointer,
    hasChanges: entriesChanged,
  }
}
