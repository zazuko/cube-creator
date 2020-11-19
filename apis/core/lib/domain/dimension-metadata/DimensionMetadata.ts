import { Constructor } from '@tpluscode/rdfine'
import { CsvMapping, DimensionMetadataCollection } from '@cube-creator/model'
import { ColumnMapping } from '@cube-creator/model/ColumnMapping'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { cc } from '@cube-creator/core/namespace'
import { schema } from '@tpluscode/rdf-ns-builders'

interface CreateColumnMetadata {
  store: ResourceStore
  csvMapping: CsvMapping
  columnMapping: ColumnMapping
}

interface ApiDimensionMetadataCollection {
  addDimensionMetadata(params: CreateColumnMetadata): DimensionMetadata.DimensionMetadata
}

declare module '@cube-creator/model' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DimensionMetadataCollection extends ApiDimensionMetadataCollection {
  }
}

export default function Mixin<Base extends Constructor<DimensionMetadataCollection>>(Resource: Base) {
  return class Impl extends Resource implements ApiDimensionMetadataCollection {
    addDimensionMetadata(params: CreateColumnMetadata): DimensionMetadata.DimensionMetadata {
      const identifier = params.csvMapping.createIdentifier(params.columnMapping.targetProperty)

      if (this.hasPart && this.hasPart.some((dimMeta) => dimMeta.about === identifier)) {
        throw new Error(`Dimension Metadata with identifier ${identifier.value} already exists`)
      }

      const dimensionMetadata = DimensionMetadata.create(this.pointer.node(id.dimensionMetadata(this, params.columnMapping)), {
        about: identifier,
      })

      this.pointer.addOut(schema.hasPart, dimensionMetadata.id)

      return dimensionMetadata
    }
  }
}

Mixin.appliesTo = cc.DimensionMetadataCollection
