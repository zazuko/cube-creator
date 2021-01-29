import { Literal, NamedNode, Term } from 'rdf-js'
import { Constructor, property } from '@tpluscode/rdfine'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { Dictionary, KeyEntityPair } from '@rdfine/prov'
import { cc } from '@cube-creator/core/namespace'
import TermMap from '@rdfjs/term-map'

declare module '@rdfine/prov' {
  interface Dictionary {
    about: NamedNode
    managedDimension: NamedNode
    replaceEntries(entries: KeyEntityPair[]): Map<Term, Term>
    changeManageDimension(managedDimension: NamedNode): void
    addMissingEntries(unmappedValues: Set<Literal>): void
  }
}

export function ProvDictionaryMixinEx<Base extends Constructor<Dictionary>>(Resource: Base) {
  class ProvDictionaryEx extends Resource {
    @property({ path: schema.about })
    about!: NamedNode

    @property({ path: cc.managedDimension })
    managedDimension!: NamedNode

    changeManageDimension(managedDimension: NamedNode) {
      this.pointer.out(prov.hadDictionaryMember).deleteOut().deleteIn()
      this.managedDimension = managedDimension
    }

    replaceEntries(entries: KeyEntityPair[]): Map<Term, Term> {
      const newEntries = new TermMap()

      const newEntryMap = entries.reduce<Map<Term, Term | undefined>>((map, { pairKey, pairEntity }) => {
        return pairKey ? map.set(pairKey, pairEntity?.id) : map
      }, new TermMap())

      // Set values for current entries or remove
      for (const entry of this.hadDictionaryMember) {
        if (!entry.pairKey || !newEntryMap.has(entry.pairKey)) {
          entry.pointer.deleteIn().deleteOut()
          continue
        }

        const newPairEntity = newEntryMap.get(entry.pairKey)
        if (!entry.pairEntity && newPairEntity) {
          newEntries.set(entry.pairKey, newPairEntity)
        }

        entry.pairEntity = newPairEntity as any
        newEntryMap.delete(entry.pairKey)
      }

      // Insert new entries
      this.hadDictionaryMember = [
        ...this.hadDictionaryMember,
        ...[...newEntryMap].reduce<KeyEntityPair[]>((arr, [pairKey, pairEntity]) => [...arr, {
          pairKey,
          pairEntity,
        } as KeyEntityPair], []),
      ]

      for (const [pairKey, pairEntity] of newEntryMap) {
        newEntries.set(pairKey, pairEntity)
      }

      return newEntries
    }

    addMissingEntries(unmappedValues: Set<Literal>) {
      const currentEntries = this.hadDictionaryMember
      const newEntries: any[] = []

      for (const key of unmappedValues) {
        if (!currentEntries.some(({ pairKey }) => pairKey?.equals(key))) {
          newEntries.push({
            pairKey: key,
          })
        }
      }

      this.hadDictionaryMember = [
        ...currentEntries,
        ...newEntries,
      ]
    }
  }

  return ProvDictionaryEx
}

ProvDictionaryMixinEx.appliesTo = prov.Dictionary
