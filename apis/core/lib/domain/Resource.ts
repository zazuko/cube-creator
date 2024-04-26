import type { DatasetCore } from '@rdfjs/types'
import { Constructor } from '@tpluscode/rdfine'
import { RdfResourceCore } from '@tpluscode/rdfine/RdfResource'
import type { GraphPointer } from 'clownface'
import $rdf from '@zazuko/env'
import { Dataset as DatasetExt } from '@zazuko/env/lib/Dataset.js'
import toCanonical from 'rdf-dataset-ext/toCanonical.js'

declare module '@tpluscode/rdfine' {
  interface RdfResource {
    strictEquals(other: Pick<RdfResourceCore, 'pointer'> | GraphPointer): boolean
  }
}

export default function Mixin<Base extends Constructor>(Resource: Base) {
  return class extends Resource {
    strictEquals(other: Pick<RdfResourceCore, 'pointer'> | GraphPointer): boolean {
      // get a subgraph where the compared resources are subjects
      const thisDataset: DatasetCore | DatasetExt = this.pointer.dataset.match(this.id)
      const otherDataset: DatasetCore | DatasetExt = 'pointer' in other
        ? other.pointer.dataset.match(other.pointer.term)
        : other.dataset.match(other.term)

      const thisDatasetExt = 'toCanonical' in thisDataset ? thisDataset : $rdf.dataset([...thisDataset])
      const otherCanonical = 'toCanonical' in otherDataset ? otherDataset : $rdf.dataset([...otherDataset])

      // compare their canonical N-Quads representations
      return toCanonical(thisDatasetExt) === toCanonical(otherCanonical)
    }
  }
}

Mixin.shouldApply = true
