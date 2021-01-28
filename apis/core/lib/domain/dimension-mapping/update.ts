import { prov } from '@tpluscode/rdf-ns-builders'
import { GraphPointer } from 'clownface'
import { NamedNode } from 'rdf-js'
import error from 'http-errors'
import { ResourceStore } from '../../ResourceStore'
import { replaceValueWithDefinedTerms } from '../queries/dimension-mappings'
import { Dictionary, KeyEntityPair } from '@rdfine/prov'
import * as ProvDictionary from '@rdfine/prov/lib/Dictionary'
import * as ProvKeyEntryPair from '@rdfine/prov/lib/KeyEntityPair'
import TermSet from '@rdfjs/term-set'
import TermMap from '@rdfjs/term-map'

interface UpdateDimensionMapping {
  resource: NamedNode
  mappings: GraphPointer<NamedNode>
  store: ResourceStore
}

function addOrUpdateEntry(addedOrUpdatedKeys: TermSet, dimensionMappings: Dictionary, currentEntries: KeyEntityPair[], newEntries: TermMap) {
  return (entry: KeyEntityPair) => {
    const key = entry.pairKey
    const definedTerm = entry.pairEntity?.id
    if (!key) {
      return
    }

    addedOrUpdatedKeys.add(key)
    const currentEntry = currentEntries.find(({ pairKey }) => key.equals(pairKey))
    if (!currentEntry) {
      newEntries.set(key, definedTerm)
      const newEntry = ProvKeyEntryPair.fromPointer(dimensionMappings.pointer.blankNode(), {
        pairKey: key,
        pairEntity: definedTerm,
      })
      dimensionMappings.hadDictionaryMember = [
        ...dimensionMappings.hadDictionaryMember,
        newEntry,
      ]
    } else {
      if (!currentEntry.pairEntity && definedTerm) {
        newEntries.set(key, definedTerm)
      }
      currentEntry.pairEntity = definedTerm as any
    }
  }
}

function removeEntryIfNeeded(addedOrUpdatedKeys: TermSet) {
  return ({ pointer, pairKey }: KeyEntityPair) => {
    if (!(pairKey && !addedOrUpdatedKeys.has(pairKey))) {
      return
    }

    pointer.deleteOut()
    pointer.deleteIn()
  }
}

export async function update({
  resource,
  mappings,
  store,
}: UpdateDimensionMapping): Promise<GraphPointer> {
  const dimensionMappings = await store.getResource<Dictionary>(resource)
  const newMappings = ProvDictionary.fromPointer(mappings)

  const currentEntries = dimensionMappings.hadDictionaryMember
  const managedDimension = newMappings.managedDimension
  const dimension = newMappings.about

  if (!dimension || !dimension.equals(dimensionMappings.about)) {
    throw new error.BadRequest('Unexpected value of schema:about')
  }

  if (!managedDimension.equals(dimensionMappings.managedDimension)) {
    dimensionMappings.pointer.out(prov.hadDictionaryMember).deleteOut().deleteIn()
    dimensionMappings.managedDimension = managedDimension
    return dimensionMappings.pointer
  }

  const addedOrUpdatedKeys = new TermSet()
  const newEntries = new TermMap()

  newMappings.hadDictionaryMember
    .forEach(addOrUpdateEntry(addedOrUpdatedKeys, dimensionMappings, currentEntries, newEntries))

  currentEntries.forEach(removeEntryIfNeeded(addedOrUpdatedKeys))

  if (newEntries.size) {
    await replaceValueWithDefinedTerms({ dimensionMapping: resource, terms: newEntries })
  }

  return dimensionMappings.pointer
}
