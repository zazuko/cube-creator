import { cc } from '@cube-creator/core/namespace'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { AnyPointer, GraphPointer } from 'clownface'
import { NamedNode, Term } from 'rdf-js'
import error from 'http-errors'
import { ResourceStore } from '../../ResourceStore'
import { replaceValueWithDefinedTerms } from '../queries/dimension-mappings'

interface UpdateDimensionMapping {
  resource: NamedNode
  mappings: GraphPointer
  store: ResourceStore
}

function addOrUpdateEntry(addedOrUpdatedKeys: Set<string>, dimensionMappings: GraphPointer, currentEntries: AnyPointer, newEntries: Map<string, Term>) {
  return (entry: GraphPointer) => {
    const key = entry.out(prov.pairKey).value
    const definedTerm = entry.out(prov.pairEntity).term
    if (!key) {
      return
    }

    addedOrUpdatedKeys.add(key)
    let [currentEntry] = currentEntries.has(prov.pairKey, key).toArray()
    if (!currentEntry) {
      dimensionMappings.addOut(prov.hadDictionaryMember, entry => {
        entry.addOut(prov.pairKey, key)
        currentEntry = entry
      })
    }

    const currentValue = currentEntry.out(prov.pairEntity).term
    if (!currentValue && definedTerm) {
      newEntries.set(key, definedTerm)
    }

    currentEntry.deleteOut(prov.pairEntity)
    if (definedTerm) {
      currentEntry.addOut(prov.pairEntity, definedTerm)
    }
  }
}

function removeEntryIfNeeded(addedOrUpdatedKeys: Set<string>) {
  return (entry: GraphPointer) => {
    const key = entry.out(prov.pairKey).value
    if (!(key && !addedOrUpdatedKeys.has(key))) {
      return
    }

    entry.deleteOut()
    entry.deleteIn()
  }
}

export async function update({
  resource,
  mappings,
  store,
}: UpdateDimensionMapping): Promise<GraphPointer> {
  const dimensionMappings = await store.get(resource)
  const currentEntries = dimensionMappings.out(prov.hadDictionaryMember)
  const managedDimension = mappings.out(cc.managedDimension).term!
  const dimension = mappings.out(schema.about).term

  if (!dimension || !dimension.equals(dimensionMappings.out(schema.about).term)) {
    throw new error.BadRequest('Unexpected value of schema:about')
  }

  if (!managedDimension.equals(dimensionMappings.out(cc.managedDimension).term)) {
    dimensionMappings.out(prov.hadDictionaryMember).deleteOut().deleteIn()
    dimensionMappings.deleteOut(cc.managedDimension).addOut(cc.managedDimension, managedDimension)
    return dimensionMappings
  }

  const addedOrUpdatedKeys = new Set<string>()
  const newEntries = new Map<string, Term>()

  mappings.out(prov.hadDictionaryMember)
    .forEach(addOrUpdateEntry(addedOrUpdatedKeys, dimensionMappings, currentEntries, newEntries))

  currentEntries.forEach(removeEntryIfNeeded(addedOrUpdatedKeys))

  if (newEntries.size) {
    await replaceValueWithDefinedTerms({ dimensionMapping: resource, terms: newEntries })
  }

  return dimensionMappings
}
