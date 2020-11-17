import { GraphPointer } from 'clownface'
import { Constructor } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'

interface ApiDimensionMetadataCollection {
  updateDimension(dimension: GraphPointer): void
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DimensionMetadataCollection extends ApiDimensionMetadataCollection {
  }
}

export default function Mixin<Base extends Constructor<Omit<DimensionMetadataCollection, keyof ApiDimensionMetadataCollection>>>(Resource: Base) {
  return class extends Resource implements ApiDimensionMetadataCollection {
    updateDimension(dimension: GraphPointer): void {
      const found = this.hasPart.find(part => part.about?.equals(dimension.out(schema.about).term))
      if (!found) {
        throw new Error('Dimension not found')
      }

      found.pointer.deleteOut()
      for (const quad of dimension.dataset.match(dimension.term)) {
        found.pointer.addOut(quad.predicate, quad.object)
      }
    }
  }
}

Mixin.appliesTo = cc.DimensionMetadataCollection
