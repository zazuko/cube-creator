import { GraphPointer } from 'clownface'
import { Constructor } from '@tpluscode/rdfine'
import { cc } from '@cube-creator/core/namespace'
import { ColumnMapping, CsvMapping, DimensionMetadataCollection } from '@cube-creator/model'
import { schema } from '@tpluscode/rdf-ns-builders'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import $rdf from 'rdf-ext'
import { shrink } from '@zazuko/rdf-vocabularies'
import { ResourceStore } from '../../ResourceStore'
import { Term } from 'rdf-js'

interface CreateColumnMetadata {
  store: ResourceStore
  csvMapping: CsvMapping
  columnMapping: ColumnMapping
}

interface FindDimensionMetadata {
  csvMapping: CsvMapping
  targetProperty: Term
}

interface ApiDimensionMetadataCollection {
  updateDimension(dimension: GraphPointer): void
  addDimensionMetadata(params: CreateColumnMetadata): DimensionMetadata.DimensionMetadata
  findDimension(params: FindDimensionMetadata): DimensionMetadata.DimensionMetadata | undefined
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DimensionMetadataCollection extends ApiDimensionMetadataCollection {
  }
}

export default function Mixin<Base extends Constructor<Omit<DimensionMetadataCollection, keyof ApiDimensionMetadataCollection>>>(Resource: Base) {
  return class extends Resource implements ApiDimensionMetadataCollection {
    updateDimension(dimension: GraphPointer): void {
      const found = this.find(dimension.out(schema.about).term)
      if (!found) {
        throw new Error('Dimension not found')
      }

      found.pointer.deleteOut()
      for (const quad of dimension.dataset.match(dimension.term)) {
        found.pointer.addOut(quad.predicate, quad.object)
      }
    }

    addDimensionMetadata(params: CreateColumnMetadata): DimensionMetadata.DimensionMetadata {
      const identifier = params.csvMapping.createIdentifier(params.columnMapping.targetProperty)

      if (this.hasPart.some((dimMeta) => dimMeta.about === identifier)) {
        throw new Error(`Dimension Metadata with identifier ${identifier.value} already exists`)
      }

      const dimensionMetadata = DimensionMetadata.create(this.pointer.node(this.getId(params.columnMapping)), {
        about: identifier,
      })

      this.pointer.addOut(schema.hasPart, dimensionMetadata.id)

      return dimensionMetadata
    }

    findDimension(params: FindDimensionMetadata): DimensionMetadata.DimensionMetadata | undefined {
      const identifier = params.csvMapping.createIdentifier(params.targetProperty)

      return this.find(identifier)
    }

    private getId(mapping: ColumnMapping) {
      const property = (mapping.targetProperty.termType === 'Literal')
        ? mapping.targetProperty.value
        : shrink(mapping.targetProperty.value) || encodeURI(mapping.targetProperty.value)

      return $rdf.namedNode(`${this.id.value}/${property}`)
    }

    private find(identifier: Term | undefined): DimensionMetadata.DimensionMetadata | undefined {
      return this.hasPart.find(part => part.about?.equals(identifier))
    }
  }
}

Mixin.appliesTo = cc.DimensionMetadataCollection
