import { Literal, NamedNode, Term } from 'rdf-js'
import { Constructor, property } from '@tpluscode/rdfine'
import { prov, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { Dictionary, KeyEntityPair } from '@rdfine/prov'
import { cc, md } from '@cube-creator/core/namespace'
import TermMap from '@rdfjs/term-map'
import $rdf from 'rdf-ext'
import TermSet from '@rdfjs/term-set'

interface DictionaryEx {
  about: NamedNode
  sharedDimensions: NamedNode[]
  onlyValidTerms: boolean
  replaceEntries(entries: KeyEntityPair[]): boolean
  changeSharedDimensions(sharedDimensions: NamedNode[]): void
  addMissingEntries(unmappedValues: Set<Literal>): void
  renameDimension(oldCube: NamedNode, newCube: NamedNode): void
}

declare module '@rdfine/prov' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Dictionary extends DictionaryEx {
  }
}

export function ProvDictionaryMixinEx<Base extends Constructor<Dictionary>>(Resource: Base) {
  class ProvDictionaryEx extends Resource implements DictionaryEx {
    @property({ path: schema.about })
    about!: NamedNode

    @property({ path: cc.sharedDimension, values: 'array' })
    sharedDimensions!: NamedNode[]

    @property({ path: md.onlyValidTerms })
    onlyValidTerms!: boolean

    changeSharedDimensions(sharedDimensions: NamedNode[]) {
      this.sharedDimensions = sharedDimensions
    }

    replaceEntries(entries: KeyEntityPair[]): boolean {
      const newEntries = new TermMap()

      const newEntryMap = entries.reduce<Map<Term, Term | undefined>>((map, { pairKey, pairEntity }) => {
        if (!pairEntity) {
          return map
        }

        return pairKey ? map.set(pairKey, pairEntity?.id) : map
      }, new TermMap())

      let entriesRemoved = false
      // Set values for current entries or remove
      for (const entry of this.hadDictionaryMember) {
        if (!entry.pairKey || !newEntryMap.has(entry.pairKey)) {
          entriesRemoved = true
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

      this.pointer.any()
        .has(rdf.type, prov.Entity)
        .filter(entity => entity.in().values.length === 0)
        .forEach(entity => entity.deleteOut())

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

      return newEntries.size > 0 || entriesRemoved
    }

    addMissingEntries(unmappedValues: Set<Literal>) {
      const currentKeys = new TermSet(this.pointer
        .out(prov.hadDictionaryMember)
        .out(prov.pairKey)
        .terms)

      for (const key of unmappedValues) {
        if (!currentKeys.has(key)) {
          this.pointer
            .addOut(prov.hadDictionaryMember, entry => {
              entry
                .addOut(rdf.type, prov.KeyEntityPair)
                .addOut(prov.pairKey, key)
            })
        }
      }
    }

    renameDimension(oldCube: NamedNode, newCube: NamedNode | undefined) {
      if (!newCube) {
        return
      }

      const pattern = new RegExp(`^${oldCube.value}`)
      this.about = $rdf.namedNode(this.about.value.replace(pattern, newCube.value))
    }
  }

  return ProvDictionaryEx
}

ProvDictionaryMixinEx.appliesTo = prov.Dictionary
