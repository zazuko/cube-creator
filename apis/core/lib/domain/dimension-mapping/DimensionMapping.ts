import { Literal, NamedNode, Term } from 'rdf-js'
import { Constructor, property } from '@tpluscode/rdfine'
import { prov, schema } from '@tpluscode/rdf-ns-builders'
import { Dictionary, KeyEntityPair } from '@rdfine/prov'
import { cc } from '@cube-creator/core/namespace'
import TermMap from '@rdfjs/term-map'
import $rdf from 'rdf-ext'

interface DictionaryEx {
  about: NamedNode
  sharedDimension: NamedNode
  replaceEntries(entries: KeyEntityPair[]): Map<Term, Term>
  changeSharedDimension(sharedDimension: NamedNode): void
  addMissingEntries(unmappedValues: Set<Literal>): void
}

declare module '@rdfine/prov' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Dictionary extends DictionaryEx {
  }
}

export const placeholderEntity = $rdf.namedNode('urn:placeholder:entity')

export function ProvDictionaryMixinEx<Base extends Constructor<Dictionary>>(Resource: Base) {
  class ProvDictionaryEx extends Resource implements DictionaryEx {
    @property({ path: schema.about })
    about!: NamedNode

    @property({ path: cc.sharedDimension })
    sharedDimension!: NamedNode

    changeSharedDimension(sharedDimension: NamedNode) {
      this.sharedDimension = sharedDimension
    }

    replaceEntries(entries: KeyEntityPair[]): Map<Term, Term> {
      const newEntries = new TermMap()

      const newEntryMap = entries.reduce<Map<Term, Term | undefined>>((map, { pairKey, pairEntity }) => {
        if (pairEntity?.id.equals(placeholderEntity)) {
          return map
        }

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
