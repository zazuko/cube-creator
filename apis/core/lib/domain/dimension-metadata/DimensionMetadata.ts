import { Constructor } from '@tpluscode/rdfine'
import { DimensionMetadataCollection } from '@cube-creator/model'
import { ColumnMapping } from '@cube-creator/model/ColumnMapping'
import * as DimensionMetadata from '@cube-creator/model/DimensionMetadata'
import { ResourceStore } from '../../ResourceStore'
import * as id from '../identifiers'
import { cc } from '@cube-creator/core/namespace'
import $rdf from 'rdf-ext'
import { NamedNode, Term } from 'rdf-js'
import { schema } from '@tpluscode/rdf-ns-builders'

interface CreateColumnMetadata {
  store: ResourceStore
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
      const dimensionMetadata = DimensionMetadata.create(this.pointer.node(id.dimensionMetadata(this, params.columnMapping)), {
        about: createIdentifier(params.columnMapping.targetProperty),
      })

      this.pointer.addOut(schema.hasPart, dimensionMetadata.id)

      return dimensionMetadata
    }
  }
}

// remove when version from csv-mapping is available
function createIdentifier(template: string | Term): NamedNode {
  if (typeof template === 'string') {
    return $rdf.namedNode('namespace/' + template)
  }

  if (template.termType === 'Literal') {
    return $rdf.namedNode('namespace/' + template.value)
  }
  if (template.termType === 'NamedNode') {
    return template
  }

  throw new Error(`Unexpected identifier template type ${template.termType}`)
}

Mixin.appliesTo = cc.DimensionMetadataCollection
