import type { Literal, NamedNode, Term } from '@rdfjs/types'
import { Constructor, property } from '@tpluscode/rdfine'
import { prov, rdf, schema } from '@tpluscode/rdf-ns-builders'
import { Dictionary } from '@rdfine/prov'
import { cc, md } from '@cube-creator/core/namespace'
import $rdf from '@zazuko/env'
import type { GraphPointer } from 'clownface'

interface DictionaryEx {
  about: NamedNode
  sharedDimensions: NamedNode[]
  onlyValidTerms: boolean
  replaceEntries(dictionary: GraphPointer): { entriesChanged: boolean }
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

    replaceEntries(dictionary: GraphPointer) {
      let entriesAdded = false

      const newEntries = dictionary.out(prov.hadDictionaryMember).toArray().reduce<Map<Term, Term | undefined>>((map, entryPtr) => {
        const pairEntity = entryPtr.out(prov.pairEntity).term
        if (!pairEntity) {
          return map
        }

        const pairKey = entryPtr.out(prov.pairKey).term
        const currentEntry = this.pointer.out(prov.hadDictionaryMember).has(prov.pairKey, pairKey)
        if (!currentEntry.term || !currentEntry.out(prov.pairEntity).term) {
          entriesAdded = true
        }
        return pairKey ? map.set(pairKey, pairEntity) : map
      }, $rdf.termMap())

      let entriesRemoved = false
      // Set values for current entries or remove
      for (const entryPtr of this.pointer.out(prov.hadDictionaryMember).toArray()) {
        const pairKey = entryPtr.out(prov.pairKey).term

        // mark as removed when not in the new map
        if (pairKey && !newEntries.has(pairKey)) {
          entriesRemoved = true
        }

        // remove form current graph
        entryPtr.deleteIn().deleteOut()
      }

      this.pointer.any()
        .has(rdf.type, prov.Entity)
        .filter(entity => entity.in().values.length === 0)
        .forEach(entity => entity.deleteOut())

      // Insert new entries
      for (const [key, entity] of newEntries) {
        if (entity) {
          this.pointer.addOut(prov.hadDictionaryMember, entry => {
            entry.addOut(prov.pairKey, key)
              .addOut(prov.pairEntity, entity)
              .addOut(rdf.type, prov.KeyEntityPair)
          })
        }
      }

      return {
        entriesChanged: entriesAdded || entriesRemoved,
      }
    }

    addMissingEntries(unmappedValues: Set<Literal>) {
      const currentKeys = $rdf.termSet(this.pointer
        .out(prov.hadDictionaryMember)
        .out(prov.pairKey)
        .terms)

      for (const key of unmappedValues) {
        if (!currentKeys.has(key)) {
          this.pointer
            .addOut(prov.hadDictionaryMember, entry => {
              entry
                .addOut(rdf.type, prov.KeyEntityPair)
                .addOut(prov.pairKey, key.value)
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
